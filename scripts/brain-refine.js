#!/usr/bin/env node
/**
 * brain-refine.js
 * Phase 2 (AI pass): turn a raw *.context.md into structured brain entries.
 *
 * Flow:  context.md  ->  Groq  ->  brain/projects/<name>/00..04.md  ->  rebuild README index
 *
 * Setup (Node 18+, no dependencies — uses built-in fetch):
 *   export GROQ_API_KEY=your_key        # Windows PowerShell: $env:GROQ_API_KEY="your_key"
 *
 * Usage:
 *   node brain-refine.js ./apnanest.context.md
 *   node brain-refine.js ./x.context.md --out ./brain --model openai/gpt-oss-120b
 *   node brain-refine.js ./x.context.md --maxchars 60000
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { loadEnv } = require('./load-env');

loadEnv();

// ---------- args ----------
const USAGE = `Usage: node scripts/brain-refine.js <context.md> [--out ./brain] [--model name] [--maxchars N]

Options:
  --out dir       Brain output folder. Default: ./brain.
  --model name    Groq model to use. Default: llama-3.3-70b-versatile.
  --maxchars N    Approximate max chars per Groq call. Larger context is chunked. Default: 30000.
  -h, --help      Show this help.`;

const args = process.argv.slice(2);
let inputPath = null;
let brainDir = path.resolve('./brain');
let model = 'llama-3.3-70b-versatile'; // swap to openai/gpt-oss-120b for deeper code reasoning
let maxChars = 30000;                  // per-call budget; larger repos are chunked

function readOptionValue(flag, index) {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    console.error(`Missing value for ${flag}\n\n${USAGE}`);
    process.exit(1);
  }
  return value;
}

if (args.includes('-h') || args.includes('--help')) {
  console.log(USAGE);
  process.exit(0);
}

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--out') brainDir = path.resolve(readOptionValue(a, i++));
  else if (a === '--model') model = readOptionValue(a, i++);
  else if (a === '--maxchars') {
    const parsed = parseInt(readOptionValue(a, i++), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      console.error(`Invalid --maxchars value: ${args[i]}\n\n${USAGE}`);
      process.exit(1);
    }
    maxChars = parsed;
  } else if (a.startsWith('--')) {
    console.error(`Unknown option: ${a}\n\n${USAGE}`);
    process.exit(1);
  } else if (!inputPath) inputPath = path.resolve(a);
  else {
    console.error(`Unexpected argument: ${a}\n\n${USAGE}`);
    process.exit(1);
  }
}

if (!inputPath) {
  console.error(USAGE);
  process.exit(1);
}
if (!fs.existsSync(inputPath) || !fs.statSync(inputPath).isFile()) {
  console.error(`Context file not found: ${inputPath}`);
  process.exit(1);
}
if (!process.env.GROQ_API_KEY) {
  console.error('Missing GROQ_API_KEY environment variable.');
  process.exit(1);
}

// ---------- read + identify ----------
let context = fs.readFileSync(inputPath, 'utf8');

let projectName = path.basename(inputPath).replace(/\.context\.md$/i, '').replace(/\.md$/i, '');
const headerMatch = context.match(/^#\s*Project Context:\s*(.+)$/m);
if (headerMatch) projectName = headerMatch[1].trim();
const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const contextHash = crypto.createHash('sha1').update(context).digest('hex').slice(0, 12);
const modelKey = model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'model';
const cacheDir = path.join(path.dirname(inputPath), '_refine_cache', `${slug}-${contextHash}-${modelKey}-${maxChars}`);

const SECTIONS = ['00-overview', '01-architecture', '02-packages', '03-implementations', '04-gotchas'];

function documentPrompt(sourceLabel, projectContext) {
  return `You are building a "code brain" entry for a developer's personal knowledge base.
Below is context for ONE project (${sourceLabel}).

Produce FIVE markdown documents. Rules:
- Base everything STRICTLY on the provided context. Never invent packages, files, or behavior.
- Be concise and scannable: short bullets, short lines, grouped. No long paragraphs.
- For implementations, paste REAL code snippets copied from the provided context or chunk summaries.
- If something is genuinely unknown (e.g. git URL), write "TODO".
- Mention skipped large files when they appear in the context; do not pretend their contents were analyzed.
- Do not copy the guidance bullets below. Replace them with project-specific facts from the context.

Output EXACTLY in this delimiter format. Nothing before, after, or between except the documents:

===FILE:00-overview===
# ${projectName} - Overview
- Describe what this project actually does.
- Summarize the stack from detected files and package metadata.
- Describe current status/scope from the context.
- Include the Git URL if it appears in the context.

===FILE:01-architecture===
# ${projectName} - Architecture
- Explain the real folder layout and what each part does.
- Explain layers and responsibilities.
- Explain request/data flow if present; otherwise say what is not present.

===FILE:02-packages===
# ${projectName} - Packages
- List each significant dependency and why it is used here.
- If there are no runtime dependencies, say that clearly.

===FILE:03-implementations===
# ${projectName} - Key Implementations
- Explain the important working pieces and notable patterns.
- Include real fenced code snippets copied from the source.

===FILE:04-gotchas===
# ${projectName} - Decisions & Gotchas
- Explain non-obvious decisions and why they matter.
- Explain things to remember and potential pitfalls.

PROJECT CONTEXT:
${projectContext}`;
}

function chunkPrompt(chunk, index, total) {
  return `You are analyzing chunk ${index}/${total} for project "${projectName}".
This is an evidence extraction pass, not the final documentation pass.

Rules:
- Use ONLY this chunk.
- Preserve exact file paths, class/function names, package names, commands, and config facts.
- Include skipped-large-file facts if listed in the repeated project snapshot.
- Capture important snippets as short fenced code blocks copied from this chunk.
- If this chunk has only metadata or partial source, say that plainly.
- Keep the answer dense and under 1400 words.

Return markdown with these headings:
## Files covered
## Architecture facts
## Dependencies and config
## Implementations and snippets
## Decisions and gotchas
## Unknowns or skipped detail

CHUNK ${index}/${total}:
${chunk.content}`;
}

function mergeEvidencePrompt(evidence, label) {
  return `Merge these ${label} notes for project "${projectName}" into one compact evidence pack.

Rules:
- Preserve all distinct important facts.
- Preserve file paths and names.
- Keep useful copied code snippets, but trim duplicates.
- Mention skipped large files and unknowns.
- Do not invent anything.
- Keep the result under 2200 words.

EVIDENCE NOTES:
${evidence}`;
}

function parseDelimitedFiles(text) {
  const parts = {};
  const regex = /===FILE:([0-9a-z-]+)===\s*([\s\S]*?)(?====FILE:|$)/g;
  let m;
  while ((m = regex.exec(text)) !== null) parts[m[1].trim()] = m[2].trim();
  return parts;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function retryDelayMs(errorText, attempt) {
  const retryMatch = String(errorText).match(/try again in ([\d.]+)s/i);
  if (retryMatch) return Math.ceil(Number(retryMatch[1]) * 1000) + 1000;
  return (attempt + 1) * 15000;
}

function isPromptTooLarge(error) {
  const text = String(error?.message || '');
  const limitMatch = text.match(/Limit\s+(\d+),\s*Requested\s+(\d+)/i);
  if (limitMatch && Number(limitMatch[2]) > Number(limitMatch[1])) return true;
  return /request too large/i.test(text);
}

async function callGroq(prompt, temperature = 0.2) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }

    const errorText = await res.text();
    const tooLarge = isPromptTooLarge({ message: errorText });
    const retryable = (res.status === 429 || /rate_limit_exceeded|tokens per minute/i.test(errorText)) && !tooLarge;
    if (retryable && attempt < 2) {
      const waitMs = retryDelayMs(errorText, attempt);
      console.warn(`  ! Groq rate limit; retrying in ${Math.round(waitMs / 1000)}s`);
      await sleep(waitMs);
      continue;
    }

    throw new Error(`Groq error ${res.status}: ${errorText}`);
  }

  throw new Error('Groq request failed after retries.');
}

function compactPreamble(preamble, budget) {
  if (!preamble || preamble.length <= budget) return preamble;
  const suffix = '\n\n[Repeated project snapshot trimmed here. File chunks below still cover the source content.]';
  return preamble.slice(0, Math.max(0, budget - suffix.length)).trimEnd() + suffix;
}

function sourceSections(sourceBody) {
  const matches = [...sourceBody.matchAll(/^### .+$/gm)];
  if (!matches.length) return [];

  return matches.map((match, index) => {
    const start = match.index;
    const end = index + 1 < matches.length ? matches[index + 1].index : sourceBody.length;
    const text = sourceBody.slice(start, end).trim();
    const rel = match[0].replace(/^###\s*/, '').trim();
    return { rel, text };
  });
}

function splitByLines(text, budget, label) {
  if (text.length <= budget) return [{ rel: label, text }];
  const lines = text.split(/\r?\n/);
  const chunks = [];
  let current = '';
  let part = 1;

  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length > budget && current) {
      chunks.push({ rel: `${label} part ${part}`, text: `### ${label} (part ${part})\n\n${current}` });
      current = line;
      part++;
    } else {
      current = next;
    }
  }

  if (current) chunks.push({ rel: `${label} part ${part}`, text: `### ${label} (part ${part})\n\n${current}` });
  return chunks;
}

function packUnits(units, budget) {
  const batches = [];
  let current = [];
  let size = 0;

  for (const unit of units) {
    const unitSize = unit.text.length + 2;
    if (current.length && size + unitSize > budget) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(unit);
    size += unitSize;
  }

  if (current.length) batches.push(current);
  return batches;
}

function splitContext(fullContext, chunkBudget) {
  if (fullContext.length <= chunkBudget) return [{ files: ['all'], content: fullContext }];

  const marker = '\n## Source files\n';
  const markerIndex = fullContext.indexOf(marker);
  if (markerIndex === -1) {
    return splitByLines(fullContext, chunkBudget, 'context')
      .map(unit => ({ files: [unit.rel], content: unit.text }));
  }

  const preamble = fullContext.slice(0, markerIndex).trim();
  const sourceBody = fullContext.slice(markerIndex + marker.length);
  const preambleBudget = Math.min(10000, Math.floor(chunkBudget * 0.35));
  const snapshot = compactPreamble(preamble, preambleBudget);
  const sourceBudget = Math.max(5000, chunkBudget - snapshot.length - 900);

  const units = [];
  for (const section of sourceSections(sourceBody)) {
    units.push(...splitByLines(section.text, sourceBudget, section.rel));
  }

  if (!units.length) {
    return splitByLines(fullContext, chunkBudget, 'context')
      .map(unit => ({ files: [unit.rel], content: unit.text }));
  }

  const batches = packUnits(units, sourceBudget);
  return batches.map((batch, index) => ({
    files: batch.map(unit => unit.rel),
    content: `${snapshot}

## Source files chunk ${index + 1}/${batches.length}

${batch.map(unit => unit.text).join('\n\n')}`,
  }));
}

function splitChunkInHalf(chunk) {
  const text = chunk.content;
  const midpoint = Math.floor(text.length / 2);
  let splitAt = text.lastIndexOf('\n### ', midpoint);
  if (splitAt < Math.floor(text.length * 0.25)) splitAt = text.indexOf('\n### ', midpoint);
  if (splitAt < 0) splitAt = text.lastIndexOf('\n', midpoint);
  if (splitAt < 0) splitAt = midpoint;

  const first = text.slice(0, splitAt).trim();
  const second = text.slice(splitAt).trim();
  return [
    { files: chunk.files.map(file => `${file} part A`), content: `${first}\n\n[This chunk was split because the model rejected the larger request.]` },
    { files: chunk.files.map(file => `${file} part B`), content: `[Continuation of split chunk for project "${projectName}".]\n\n${second}` },
  ].filter(part => part.content.trim());
}

async function summarizeChunk(chunk, label, total, depth = 0) {
  try {
    return await callGroq(chunkPrompt(chunk, label, total), 0.1);
  } catch (err) {
    if (!isPromptTooLarge(err) || depth >= 4 || chunk.content.length < 5000) throw err;

    const parts = splitChunkInHalf(chunk);
    console.warn(`  ! Chunk ${label}/${total} was too large; splitting into ${parts.length} smaller chunk(s).`);
    const summaries = [];
    for (let i = 0; i < parts.length; i++) {
      summaries.push(await summarizeChunk(parts[i], `${label}.${i + 1}`, total, depth + 1));
    }
    return summaries.join('\n\n');
  }
}

function packStrings(items, budget) {
  const groups = [];
  let current = [];
  let size = 0;

  for (const item of items) {
    const itemSize = item.length + 2;
    if (current.length && size + itemSize > budget) {
      groups.push(current);
      current = [];
      size = 0;
    }
    current.push(item);
    size += itemSize;
  }

  if (current.length) groups.push(current);
  return groups;
}

async function condenseEvidence(items, budget) {
  let evidenceItems = items;
  let evidence = evidenceItems.join('\n\n');
  let round = 1;

  while (evidence.length > budget) {
    const groups = packStrings(evidenceItems, Math.max(4000, budget - 1500));
    console.log(`Condensing evidence round ${round}: ${groups.length} group(s)`);

    const nextItems = [];
    for (let i = 0; i < groups.length; i++) {
      const label = `evidence group ${i + 1}/${groups.length}`;
      const merged = await callGroq(mergeEvidencePrompt(groups[i].join('\n\n'), label), 0.1);
      nextItems.push(`## Condensed ${label}\n${merged.trim()}`);
    }

    const nextEvidence = nextItems.join('\n\n');
    if (nextEvidence.length >= evidence.length && groups.length === 1) {
      const tighter = await callGroq(`${mergeEvidencePrompt(nextEvidence, 'already-condensed evidence')}\n\nMake it much shorter while preserving architecture, packages, important implementations, skipped files, and gotchas.`, 0.1);
      evidenceItems = [`## Condensed evidence\n${tighter.trim()}`];
    } else {
      evidenceItems = nextItems;
    }

    evidence = evidenceItems.join('\n\n');
    round++;
    if (round > 5) break;
  }

  return evidence;
}

function cachePath(name) {
  return path.join(cacheDir, name);
}

function readCache(name) {
  const file = cachePath(name);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function writeCache(name, value) {
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cachePath(name), value);
}

function chunkCacheName(index) {
  return `chunk-${String(index + 1).padStart(3, '0')}.md`;
}

// ---------- run ----------
async function main() {
  let text = '';
  let chunkCount = 1;

  if (context.length <= maxChars) {
    text = await callGroq(documentPrompt('full raw project context', context));
  } else {
    const chunkBudget = Math.max(6000, maxChars - 2500);
    const finalBudget = Math.max(6000, maxChars - 4500);
    const chunks = splitContext(context, chunkBudget);
    chunkCount = chunks.length;

    console.log(`Context length: ${context.length} chars`);
    console.log(`Split into ${chunkCount} chunk(s); no raw context truncation.`);

    const summaries = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const cached = readCache(chunkCacheName(i));
      let summary = cached;
      if (summary) {
        console.log(`Using cached summary ${i + 1}/${chunks.length}: ${chunk.files.slice(0, 4).join(', ')}${chunk.files.length > 4 ? ', ...' : ''}`);
      } else {
        console.log(`Summarizing chunk ${i + 1}/${chunks.length}: ${chunk.files.slice(0, 4).join(', ')}${chunk.files.length > 4 ? ', ...' : ''}`);
        summary = await summarizeChunk(chunk, i + 1, chunks.length);
        writeCache(chunkCacheName(i), summary.trim() + '\n');
      }
      summaries.push(`## Chunk ${i + 1}/${chunks.length}
Files: ${chunk.files.join(', ')}

${summary.trim()}`);
    }

    let evidence = readCache('evidence.md');
    if (evidence) {
      console.log('Using cached merged evidence.');
    } else {
      evidence = await condenseEvidence(summaries, finalBudget);
      writeCache('evidence.md', evidence.trim() + '\n');
    }

    text = readCache('final-delimited.md');
    if (text) {
      console.log('Using cached final markdown response.');
    } else {
      text = await callGroq(documentPrompt('full-project evidence merged from every chunk', evidence));
      writeCache('final-delimited.md', text.trim() + '\n');
    }
  }

  // split delimiter sections (robust for code-heavy content; avoids JSON escaping issues)
  const parts = parseDelimitedFiles(text);

  const projDir = path.join(brainDir, 'projects', slug);
  fs.mkdirSync(projDir, { recursive: true });

  let written = 0;
  for (const key of SECTIONS) {
    if (parts[key]) {
      fs.writeFileSync(path.join(projDir, `${key}.md`), parts[key] + '\n');
      written++;
    } else {
      console.warn(`  ! missing section: ${key}`);
    }
  }

  fs.copyFileSync(inputPath, path.join(projDir, 'raw.context.md')); // fallback detail
  rebuildIndex(brainDir);
  rebuildDashboard(brainDir);

  console.log(`Refined "${projectName}" -> ${projDir}`);
  console.log(`Sections: ${written}/5${chunkCount > 1 ? `  (context split into ${chunkCount} chunks; no raw truncation)` : ''}`);
}

function rebuildDashboard(dir) {
  const uiScript = path.join(__dirname, 'brain-ui.js');
  if (!fs.existsSync(uiScript)) return;
  try {
    execFileSync('node', [uiScript, '--out', dir], { stdio: 'inherit' });
  } catch (err) {
    console.warn(`  ! dashboard not rebuilt: ${err.message.split('\n')[0]}`);
  }
}

// ---------- index ----------
function rebuildIndex(dir) {
  const projectsDir = path.join(dir, 'projects');
  if (!fs.existsSync(projectsDir)) return;

  const rows = [];
  for (const name of fs.readdirSync(projectsDir).sort()) {
    const overview = path.join(projectsDir, name, '00-overview.md');
    let summary = '';
    if (fs.existsSync(overview)) {
      const lines = fs.readFileSync(overview, 'utf8').split('\n').map(l => l.trim());
      const bullet = lines.find(l => l.startsWith('- '));
      summary = bullet ? bullet.replace(/^-\s*/, '').slice(0, 120) : '';
    }
    rows.push(`| [${name}](./projects/${name}/00-overview.md) | ${summary} |`);
  }

  const out = `# Code Brain — Index

> Personal knowledge base of shipped projects. This file is regenerated automatically.

| Project | Summary |
| --- | --- |
${rows.join('\n')}

## Folders
- \`projects/\` — one folder per project (00 overview … 04 gotchas + raw context)
- \`patterns/\` — cross-project reusable patterns (write by hand as you spot them)
- \`ideas/\` — new ideas, dated YYYY-MM-DD
`;
  fs.writeFileSync(path.join(dir, 'README.md'), out);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

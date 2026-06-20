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
 *   node brain-refine.js ./x.context.md --maxchars 200000
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadEnv } = require('./load-env');

loadEnv();

// ---------- args ----------
const USAGE = `Usage: node scripts/brain-refine.js <context.md> [--out ./brain] [--model name] [--maxchars N]

Options:
  --out dir       Brain output folder. Default: ./brain.
  --model name    Groq model to use. Default: llama-3.3-70b-versatile.
  --maxchars N    Limit context sent to the model. Default: 120000.
  -h, --help      Show this help.`;

const args = process.argv.slice(2);
let inputPath = null;
let brainDir = path.resolve('./brain');
let model = 'llama-3.3-70b-versatile'; // swap to openai/gpt-oss-120b for deeper code reasoning
let maxChars = 120000;                 // ~30k tokens; raise if your model's context allows

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

let truncated = false;
if (context.length > maxChars) {
  context = context.slice(0, maxChars);
  truncated = true;
}

const SECTIONS = ['00-overview', '01-architecture', '02-packages', '03-implementations', '04-gotchas'];

const prompt = `You are building a "code brain" entry for a developer's personal knowledge base.
Below is the full context of ONE project (stack, file tree, source files).

Produce FIVE markdown documents. Rules:
- Base everything STRICTLY on the provided context. Never invent packages, files, or behavior.
- Be concise and scannable: short bullets, short lines, grouped. No long paragraphs.
- For implementations, paste REAL code snippets copied from the source, trimmed to the relevant part.
- If something is genuinely unknown (e.g. git URL), write "TODO".
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
${context}`;

// ---------- run ----------
async function main() {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error(`Groq error ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';

  // split delimiter sections (robust for code-heavy content; avoids JSON escaping issues)
  const parts = {};
  const regex = /===FILE:([0-9a-z-]+)===\s*([\s\S]*?)(?====FILE:|$)/g;
  let m;
  while ((m = regex.exec(text)) !== null) parts[m[1].trim()] = m[2].trim();

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
  console.log(`Sections: ${written}/5${truncated ? '  (context was truncated — consider --maxchars or split)' : ''}`);
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

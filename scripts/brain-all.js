#!/usr/bin/env node
/**
 * brain-all.js
 * Run the whole pipeline over every repo inside a PARENT folder.
 * For each subfolder:  bundle  ->  refine  ->  (index rebuilds itself)
 *
 * Setup (Node 18+):  export GROQ_API_KEY=...   (skip with --bundle-only)
 *
 * Usage:
 *   node brain-all.js ./all-my-repos
 *   node brain-all.js ./all-my-repos --out ./brain --model openai/gpt-oss-120b
 *   node brain-all.js ./all-my-repos --bundle-only        # just make context files, no AI
 *   node brain-all.js ./all-my-repos --maxkb 200 --maxchars 30000
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadEnv } = require('./load-env');

loadEnv();

const HERE = __dirname;
const BUNDLE = path.join(HERE, 'brain-bundle.js');
const REFINE = path.join(HERE, 'brain-refine.js');
const UI = path.join(HERE, 'brain-ui.js');
const TOOL_ROOT = path.resolve(HERE, '..');

// ---------- args ----------
const USAGE = `Usage: node scripts/brain-all.js <parentFolderOfRepos> [--out ./brain] [--bundle-only] [--model name] [--maxkb N] [--maxchars N]

Options:
  --out dir       Brain output folder. Default: ./brain.
  --bundle-only   Build raw context files without the Groq refine step.
  --model name    Groq model to use for refinement.
  --maxkb N       Skip source files larger than N KB. Default: 250.
  --maxchars N    Approximate max chars per Groq call; larger context is chunked. Default: 30000.
  -h, --help      Show this help.`;

const args = process.argv.slice(2);
let parentDir = null;
let brainDir = path.resolve('./brain');
let model = 'llama-3.3-70b-versatile';
let maxKb = 250;
let maxChars = 30000;
let bundleOnly = false;

function readOptionValue(flag, index) {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    console.error(`Missing value for ${flag}\n\n${USAGE}`);
    process.exit(1);
  }
  return value;
}

function readPositiveInt(flag, index, fallback) {
  const parsed = parseInt(readOptionValue(flag, index), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.error(`Invalid ${flag} value: ${args[index + 1]}\n\n${USAGE}`);
    process.exit(1);
  }
  return parsed || fallback;
}

if (args.includes('-h') || args.includes('--help')) {
  console.log(USAGE);
  process.exit(0);
}

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--out') brainDir = path.resolve(readOptionValue(a, i++));
  else if (a === '--model') model = readOptionValue(a, i++);
  else if (a === '--maxkb') maxKb = readPositiveInt(a, i++);
  else if (a === '--maxchars') maxChars = readPositiveInt(a, i++);
  else if (a === '--bundle-only') bundleOnly = true;
  else if (a.startsWith('--')) {
    console.error(`Unknown option: ${a}\n\n${USAGE}`);
    process.exit(1);
  } else if (!parentDir) parentDir = path.resolve(a);
  else {
    console.error(`Unexpected argument: ${a}\n\n${USAGE}`);
    process.exit(1);
  }
}

if (!parentDir) {
  console.error(USAGE);
  process.exit(1);
}
if (!fs.existsSync(parentDir) || !fs.statSync(parentDir).isDirectory()) {
  console.error(`Parent folder not found: ${parentDir}`);
  process.exit(1);
}
if (!bundleOnly && !process.env.GROQ_API_KEY) {
  console.error('Missing GROQ_API_KEY. Set it, or pass --bundle-only to skip the AI step.');
  process.exit(1);
}

// ---------- find repos ----------
const SKIP = new Set(['brain', 'node_modules', '.git', 'code-brain', 'codebrain']);
const repos = fs.readdirSync(parentDir, { withFileTypes: true })
  .map(e => ({ entry: e, full: path.join(parentDir, e.name) }))
  .filter(({ entry, full }) => {
    if (!entry.isDirectory() || entry.name.startsWith('.')) return false;
    if (SKIP.has(entry.name.toLowerCase())) return false;
    const resolved = path.resolve(full);
    return resolved !== TOOL_ROOT && resolved !== path.resolve(brainDir);
  })
  .map(({ entry, full }) => ({ name: entry.name, full }));

if (!repos.length) {
  console.error(`No project folders found inside ${parentDir}`);
  process.exit(1);
}

const stagingDir = path.join(brainDir, '_staging');
fs.mkdirSync(stagingDir, { recursive: true });

console.log(`Found ${repos.length} repo(s) in ${parentDir}`);
console.log(bundleOnly ? 'Mode: bundle only\n' : `Mode: bundle + refine (${model})\n`);

const ok = [];
const failed = [];

for (const [idx, repo] of repos.entries()) {
  const tag = `[${idx + 1}/${repos.length}] ${repo.name}`;
  const contextPath = path.join(stagingDir, `${repo.name}.context.md`);
  try {
    console.log(`${tag}  -> bundling`);
    execFileSync('node', [BUNDLE, repo.full, '--out', contextPath, '--maxkb', String(maxKb)], { stdio: 'pipe' });

    if (!bundleOnly) {
      console.log(`${tag}  -> refining`);
      execFileSync('node', [REFINE, contextPath, '--out', brainDir, '--model', model, '--maxchars', String(maxChars)],
        { stdio: 'inherit' });
    }
    ok.push(repo.name);
  } catch (err) {
    console.error(`${tag}  -> FAILED: ${err.message.split('\n')[0]}`);
    failed.push(repo.name);
  }
}

console.log(`\nDone. Success: ${ok.length}, Failed: ${failed.length}`);
if (failed.length) console.log('Failed repos:', failed.join(', '));
console.log(`Brain: ${brainDir}`);
if (bundleOnly) console.log(`Context files staged in: ${stagingDir}`);
try {
  execFileSync('node', [UI, '--out', brainDir], { stdio: 'inherit' });
} catch (err) {
  console.warn(`Dashboard not rebuilt: ${err.message.split('\n')[0]}`);
}

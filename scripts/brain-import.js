#!/usr/bin/env node
/**
 * Import one GitHub repository into the code brain.
 *
 * Usage:
 *   node scripts/brain-import.js https://github.com/owner/repo
 *   node scripts/brain-import.js https://github.com/owner/repo --bundle-only
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

const USAGE = `Usage: node scripts/brain-import.js <github-url-or-local-folder> [--out ./brain] [--bundle-only] [--model name] [--maxkb N] [--maxchars N] [--fresh]

Options:
  --out dir       Brain output folder. Default: ./brain.
  --bundle-only   Build raw context without the Groq refine step.
  --model name    Groq model to use for refinement.
  --maxkb N       Skip source files larger than N KB. Default: 250.
  --maxchars N    Approximate max chars per Groq call; larger context is chunked. Default: 30000.
  --fresh         Delete the cached clone before importing.
  -h, --help      Show this help.`;

const args = process.argv.slice(2);
let source = null;
let brainDir = path.resolve('./brain');
let model = 'llama-3.3-70b-versatile';
let maxKb = 250;
let maxChars = 30000;
let bundleOnly = false;
let fresh = false;

function readOptionValue(flag, index) {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    console.error(`Missing value for ${flag}\n\n${USAGE}`);
    process.exit(1);
  }
  return value;
}

function readPositiveInt(flag, index) {
  const parsed = parseInt(readOptionValue(flag, index), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.error(`Invalid ${flag} value: ${args[index + 1]}\n\n${USAGE}`);
    process.exit(1);
  }
  return parsed;
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
  else if (a === '--fresh') fresh = true;
  else if (a.startsWith('--')) {
    console.error(`Unknown option: ${a}\n\n${USAGE}`);
    process.exit(1);
  } else if (!source) source = a;
  else {
    console.error(`Unexpected argument: ${a}\n\n${USAGE}`);
    process.exit(1);
  }
}

if (!source) {
  console.error(USAGE);
  process.exit(1);
}
if (!bundleOnly && !process.env.GROQ_API_KEY) {
  console.error('Missing GROQ_API_KEY. Set it, or pass --bundle-only to create raw context only.');
  process.exit(1);
}

function isGithubUrl(value) {
  return /^https?:\/\/github\.com\/[^/]+\/[^/\s#?]+/i.test(value) || /^git@github\.com:[^/]+\/[^/\s#?]+/i.test(value);
}

function slugFromSource(value) {
  if (!isGithubUrl(value)) {
    return path.basename(path.resolve(value)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
  }

  const cleaned = value
    .replace(/\.git$/i, '')
    .replace(/[?#].*$/, '')
    .replace(/^git@github\.com:/i, '')
    .replace(/^https?:\/\/github\.com\//i, '');
  const parts = cleaned.split(/[\\/]/).filter(Boolean);
  const repo = parts[parts.length - 1] || path.basename(path.resolve(value));
  return repo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
}

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', ...options });
}

fs.mkdirSync(brainDir, { recursive: true });
const stagingDir = path.join(brainDir, '_staging');
const repoCacheDir = path.join(brainDir, '_repos');
fs.mkdirSync(stagingDir, { recursive: true });
fs.mkdirSync(repoCacheDir, { recursive: true });

const slug = slugFromSource(source);
let repoDir = path.resolve(source);

if (isGithubUrl(source)) {
  repoDir = path.join(repoCacheDir, slug);
  if (fresh && fs.existsSync(repoDir)) {
    fs.rmSync(repoDir, { recursive: true, force: true });
  }
  if (fs.existsSync(path.join(repoDir, '.git'))) {
    console.log(`Updating cached repo: ${repoDir}`);
    run('git', ['-C', repoDir, 'pull', '--ff-only']);
  } else {
    if (fs.existsSync(repoDir)) fs.rmSync(repoDir, { recursive: true, force: true });
    console.log(`Cloning ${source} -> ${repoDir}`);
    run('git', ['clone', '--depth', '1', source, repoDir]);
  }
} else if (!fs.existsSync(repoDir) || !fs.statSync(repoDir).isDirectory()) {
  console.error(`Source is not a GitHub URL or local folder: ${source}`);
  process.exit(1);
}

const contextPath = path.join(stagingDir, `${slug}.context.md`);
console.log(`Bundling ${repoDir}`);
const bundleArgs = [BUNDLE, repoDir, '--out', contextPath, '--maxkb', String(maxKb)];
if (isGithubUrl(source)) bundleArgs.push('--source-url', source);
run('node', bundleArgs);

if (bundleOnly) {
  const projectDir = path.join(brainDir, 'projects', slug);
  fs.mkdirSync(projectDir, { recursive: true });
  fs.copyFileSync(contextPath, path.join(projectDir, 'raw.context.md'));
  const overviewPath = path.join(projectDir, '00-overview.md');
  if (!fs.existsSync(overviewPath)) {
    fs.writeFileSync(overviewPath, `# ${slug} - Overview

- Bundle-only import from ${source}.
- Run \`npm run import -- ${source}\` with \`GROQ_API_KEY\` set to generate architecture, package, implementation, and gotcha notes.
- Git URL: ${isGithubUrl(source) ? source : 'TODO'}

## Available Detail

- Open \`raw.context.md\` for the bundled source context.
`);
  }
  console.log(`Bundle-only mode. Raw context copied to: ${path.join(projectDir, 'raw.context.md')}`);
} else {
  console.log(`Refining ${slug} with ${model}`);
  run('node', [REFINE, contextPath, '--out', brainDir, '--model', model, '--maxchars', String(maxChars)]);
}

run('node', [UI, '--out', brainDir]);
console.log(`Done. Open ${path.join(brainDir, 'index.html')}`);

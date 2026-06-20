#!/usr/bin/env node
/**
 * brain-bundle.js
 * Turn any repo into ONE structured Markdown context file for your "code brain".
 *
 * Usage:
 *   node brain-bundle.js                      # bundles current folder
 *   node brain-bundle.js ./path/to/project    # bundles that folder
 *   node brain-bundle.js . --out brain.md     # custom output path
 *   node brain-bundle.js . --maxkb 150        # skip files bigger than 150 KB
 *
 * Works for .NET, Node, React, Next.js, Python, etc. No dependencies.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// ---------- args ----------
const USAGE = `Usage: node scripts/brain-bundle.js [projectDir] [--out file] [--maxkb N] [--source-url url]

Options:
  --out file       Write the generated context markdown to this path.
  --maxkb N        Skip source files larger than N KB. Default: 250.
  --source-url url Store the repo/source URL in the generated context.
  -h, --help       Show this help.`;

const args = process.argv.slice(2);
let targetDir = process.cwd();
let outPath = null;
let maxKb = 250;
let sourceUrl = '';
let sawTarget = false;

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
  if (a === '--out') outPath = path.resolve(readOptionValue(a, i++));
  else if (a === '--source-url') sourceUrl = readOptionValue(a, i++);
  else if (a === '--maxkb') {
    const parsed = parseInt(readOptionValue(a, i++), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      console.error(`Invalid --maxkb value: ${args[i]}\n\n${USAGE}`);
      process.exit(1);
    }
    maxKb = parsed;
  } else if (a.startsWith('--')) {
    console.error(`Unknown option: ${a}\n\n${USAGE}`);
    process.exit(1);
  } else if (!sawTarget) {
    targetDir = path.resolve(a);
    sawTarget = true;
  } else {
    console.error(`Unexpected argument: ${a}\n\n${USAGE}`);
    process.exit(1);
  }
}

const ROOT = path.resolve(targetDir);
if (!fs.existsSync(ROOT) || !fs.statSync(ROOT).isDirectory()) {
  console.error(`Project folder not found: ${ROOT}`);
  process.exit(1);
}

const projectName = path.basename(ROOT);
if (!outPath) outPath = path.join(ROOT, `${projectName}.context.md`);
const MAX_BYTES = maxKb * 1024;

function detectGitUrl() {
  if (sourceUrl) return sourceUrl;
  try {
    return execFileSync('git', ['-C', ROOT, 'config', '--get', 'remote.origin.url'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'TODO';
  }
}

// ---------- exclusions ----------
const EXCLUDED_DIRS = new Set([
  'node_modules', 'bin', 'obj', 'dist', 'build', 'out', '.next', '.nuxt',
  '.turbo', '.cache', '.git', '.vs', '.vscode', '.idea', '.svelte-kit',
  'vendor', '__pycache__', '.pytest_cache', 'target', 'Pods', 'DerivedData',
  'coverage', '_repos', '_staging'
]);

const EXCLUDED_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
  'host.json', 'appsettings.json', 'local.settings.json',
  '.DS_Store', 'Thumbs.db'
]);

const EXCLUDED_EXT = new Set([
  '.dll', '.pdb', '.exe', '.user', '.suo', '.bin', '.so', '.dylib',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.avif', '.bmp',
  '.mp4', '.webm', '.mov', '.mp3', '.wav',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z', '.map', '.log'
]);

const LANG = {
  '.js': 'javascript', '.jsx': 'jsx', '.ts': 'typescript', '.tsx': 'tsx',
  '.cs': 'csharp', '.json': 'json', '.html': 'html', '.css': 'css',
  '.scss': 'scss', '.sql': 'sql', '.py': 'python', '.sh': 'bash',
  '.md': 'markdown', '.yml': 'yaml', '.yaml': 'yaml', '.razor': 'razor',
  '.csproj': 'xml', '.config': 'xml', '.xml': 'xml'
};

function isExcludedFile(name) {
  if (EXCLUDED_FILES.has(name)) return true;
  if (name.startsWith('.env')) return true;
  if (name.startsWith('appsettings.')) return true;
  if (name.endsWith('.context.md')) return true;
  if (name === 'raw.context.md') return true;
  if (/\.min\.(js|css)$/.test(name)) return true;
  if (EXCLUDED_EXT.has(path.extname(name).toLowerCase())) return true;
  return false;
}

// ---------- walk ----------
const collected = [];     // { rel, full, size }
const skippedLarge = [];  // { rel, size }

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isSymbolicLink()) continue;
    const full = path.join(dir, e.name);

    if (e.isDirectory()) {
      if (EXCLUDED_DIRS.has(e.name)) continue;
      walk(full);
      continue;
    }
    if (!e.isFile()) continue;
    if (isExcludedFile(e.name)) continue;

    let size = 0;
    try {
      size = fs.statSync(full).size;
    } catch {
      continue;
    }
    const rel = path.relative(ROOT, full);
    if (rel === path.join('brain', 'index.html')) continue;
    if (size > MAX_BYTES) {
      skippedLarge.push({ rel, size });
      continue;
    }
    collected.push({ rel, full, size });
  }
}

// ---------- stack detection ----------
function detectStack() {
  const lines = [];

  const pkgFiles = collected.filter(f => path.basename(f.rel) === 'package.json');
  for (const pkgFile of pkgFiles) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgFile.full, 'utf8'));
      lines.push(`### npm - ${pkgFile.rel}`);
      if (pkg.name) lines.push(`**name** ${pkg.name}`);
      for (const key of ['dependencies', 'devDependencies']) {
        if (pkg[key] && Object.keys(pkg[key]).length) {
          lines.push(`**${key}**`);
          for (const [k, v] of Object.entries(pkg[key])) lines.push(`- ${k} ${v}`);
        }
      }
    } catch { /* ignore bad json */ }
  }

  for (const c of collected.filter(f => f.rel.endsWith('.csproj'))) {
    try {
      const txt = fs.readFileSync(c.full, 'utf8');
      const refs = [...txt.matchAll(/<PackageReference\s+Include="([^"]+)"(?:\s+Version="([^"]+)")?/g)];
      if (refs.length) {
        lines.push(`### NuGet - ${c.rel}`);
        for (const m of refs) lines.push(`- ${m[1]}${m[2] ? ' ' + m[2] : ''}`);
      }
    } catch { /* ignore */ }
  }

  return lines.length ? lines.join('\n') : '_No package.json or .csproj detected._';
}

// ---------- file tree ----------
function buildTree(paths) {
  const tree = {};
  for (const p of paths) {
    let node = tree;
    for (const part of p.split(path.sep)) {
      node[part] = node[part] || {};
      node = node[part];
    }
  }
  const out = [];
  (function render(node, prefix) {
    const keys = Object.keys(node).sort();
    keys.forEach((k, i) => {
      const last = i === keys.length - 1;
      out.push(prefix + (last ? '`-- ' : '|-- ') + k);
      render(node[k], prefix + (last ? '    ' : '|   '));
    });
  })(tree, '');
  return out.join('\n');
}

function extStats() {
  const counts = {};
  for (const f of collected) {
    const ext = path.extname(f.rel).toLowerCase() || '(none)';
    counts[ext] = (counts[ext] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([e, c]) => `- ${e}: ${c}`)
    .join('\n');
}

// ---------- run ----------
walk(ROOT);
collected.sort((a, b) => a.rel.localeCompare(b.rel));

fs.mkdirSync(path.dirname(outPath), { recursive: true });
const stream = fs.createWriteStream(outPath, { flags: 'w' });
const FENCE = '````'; // 4 backticks so source files containing ``` don't break it

stream.write(`# Project Context: ${projectName}\n\n`);
stream.write(`- Generated: ${new Date().toISOString()}\n`);
stream.write(`- Source path: ${ROOT}\n`);
stream.write(`- Git URL: ${detectGitUrl()}\n`);
stream.write(`- Files included: ${collected.length}\n`);
stream.write(`- Files skipped (> ${maxKb} KB): ${skippedLarge.length}\n\n`);

stream.write(`## Detected stack & packages\n\n${detectStack()}\n\n`);
stream.write(`## File type breakdown\n\n${extStats()}\n\n`);
stream.write(`## File tree\n\n\`\`\`\n${buildTree(collected.map(f => f.rel))}\n\`\`\`\n\n`);

if (skippedLarge.length) {
  stream.write(`## Skipped large files\n\n`);
  for (const s of skippedLarge) stream.write(`- ${s.rel} (${Math.round(s.size / 1024)} KB)\n`);
  stream.write('\n');
}

stream.write(`## Source files\n`);
for (const f of collected) {
  const lang = LANG[path.extname(f.rel).toLowerCase()] || '';
  stream.write(`\n### ${f.rel}\n\n`);
  stream.write(`${FENCE}${lang}\n`);
  try {
    stream.write(fs.readFileSync(f.full, 'utf8'));
  } catch (err) {
    stream.write(`[ERROR READING FILE: ${err.message}]`);
  }
  stream.write(`\n${FENCE}\n`);
}

stream.end();
stream.on('error', err => {
  console.error(`Failed to write ${outPath}: ${err.message}`);
  process.exit(1);
});
stream.on('finish', () => {
  console.log(`Done. ${collected.length} files -> ${outPath}`);
  if (skippedLarge.length) console.log(`Skipped ${skippedLarge.length} large file(s).`);
});

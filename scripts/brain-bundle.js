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
const USAGE = `Usage: node scripts/brain-bundle.js [projectDir] [--out file] [--maxkb N] [--source-url url] [--include-styles]

Options:
  --out file        Write the generated context markdown to this path.
  --maxkb N         Skip source files larger than N KB. Default: 250.
  --source-url url  Store the repo/source URL in the generated context.
  --include-styles  Include CSS/SCSS/Less/Stylus files. Default: skip style files.
  -h, --help        Show this help.`;

const args = process.argv.slice(2);
let targetDir = process.cwd();
let outPath = null;
let maxKb = 250;
let sourceUrl = '';
let includeStyles = false;
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
  else if (a === '--include-styles') includeStyles = true;
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
  'coverage', '_repos', '_staging', '_runs'
]);

const EXCLUDED_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
  'host.json', 'appsettings.json', 'local.settings.json',
  '.DS_Store', 'Thumbs.db'
]);

const EXCLUDED_EXT = new Set([
  '.dll', '.pdb', '.exe', '.user', '.suo', '.bin', '.so', '.dylib',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.avif', '.bmp',
  '.heic', '.heif', '.tif', '.tiff', '.psd', '.ai', '.eps', '.fig', '.sketch',
  '.mp4', '.webm', '.mov', '.mp3', '.wav',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z', '.map', '.log', '.pid'
]);

const STYLE_EXT = new Set(['.css', '.scss', '.sass', '.less', '.styl', '.pcss']);
const MEDIA_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.avif', '.bmp',
  '.heic', '.heif', '.tif', '.tiff', '.psd', '.ai', '.eps', '.fig', '.sketch',
  '.mp4', '.webm', '.mov', '.mp3', '.wav',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
]);

const LANG = {
  '.js': 'javascript', '.jsx': 'jsx', '.ts': 'typescript', '.tsx': 'tsx',
  '.cs': 'csharp', '.json': 'json', '.html': 'html', '.css': 'css',
  '.scss': 'scss', '.sql': 'sql', '.py': 'python', '.sh': 'bash',
  '.md': 'markdown', '.yml': 'yaml', '.yaml': 'yaml', '.razor': 'razor',
  '.csproj': 'xml', '.config': 'xml', '.xml': 'xml'
};

const SUMMARY_EXT = new Set(['.ipynb', '.npz', '.tiktoken']);
const LARGE_DATA_EXT = new Set(['.json', '.txt', '.csv', '.tsv']);
const LARGE_DATA_BYTES = 24 * 1024;

function isExcludedFile(name) {
  const ext = path.extname(name).toLowerCase();
  if (EXCLUDED_FILES.has(name)) return true;
  if (name.startsWith('.env')) return true;
  if (name.startsWith('appsettings.')) return true;
  if (name.endsWith('.context.md')) return true;
  if (name === 'raw.context.md') return true;
  if (/\.min\.(js|css)$/.test(name)) return true;
  if (!includeStyles && STYLE_EXT.has(ext)) return true;
  if (EXCLUDED_EXT.has(ext)) return true;
  return false;
}

function shouldSummarizeFile(file) {
  const ext = path.extname(file.rel).toLowerCase();
  if (SUMMARY_EXT.has(ext)) return true;
  return LARGE_DATA_EXT.has(ext) && file.size > LARGE_DATA_BYTES;
}

function summarizeJsonValue(value, depth = 0) {
  if (depth > 2) return typeof value;
  if (Array.isArray(value)) {
    const samples = value.slice(0, 3).map(item => summarizeJsonValue(item, depth + 1));
    return `array(${value.length})${samples.length ? ` sample: ${samples.join('; ')}` : ''}`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    const sample = keys.slice(0, 12).map(key => `${key}: ${summarizeJsonValue(value[key], depth + 1)}`);
    return `object(${keys.length} keys)${sample.length ? ` sample keys: ${sample.join('; ')}` : ''}`;
  }
  if (typeof value === 'string') return value.length > 80 ? `string(${value.length} chars)` : JSON.stringify(value);
  return String(value);
}

function summarizeNotebook(json) {
  const cells = Array.isArray(json.cells) ? json.cells : [];
  const lines = [
    `Notebook cells: ${cells.length}`,
    `Kernel: ${json.metadata?.kernelspec?.display_name || json.metadata?.kernelspec?.name || 'unknown'}`,
    '',
    'Cell outline:',
  ];

  for (const [index, cell] of cells.slice(0, 18).entries()) {
    const source = Array.isArray(cell.source) ? cell.source.join('') : String(cell.source || '');
    const firstLine = source.split(/\r?\n/).map(line => line.trim()).find(Boolean) || '(empty)';
    lines.push(`- ${index + 1}. ${cell.cell_type || 'cell'}: ${firstLine.slice(0, 160)}`);
  }
  if (cells.length > 18) lines.push(`- ... ${cells.length - 18} more cells omitted from bundle summary.`);
  return lines.join('\n');
}

function summarizeTextData(text) {
  const lines = text.split(/\r?\n/);
  return [
    `Lines: ${lines.length}`,
    `Characters: ${text.length}`,
    '',
    'First non-empty lines:',
    ...lines.map(line => line.trim()).filter(Boolean).slice(0, 20).map(line => `- ${line.slice(0, 180)}`),
  ].join('\n');
}

function summaryForFile(file) {
  if (!shouldSummarizeFile(file)) return '';
  const ext = path.extname(file.rel).toLowerCase();
  const header = [
    '[SUMMARIZED FILE]',
    `Path: ${file.rel}`,
    `Size: ${Math.round(file.size / 1024)} KB`,
    `Reason: large data/notebook/asset file summarized to preserve AI context budget for source code.`,
    '',
  ];

  try {
    if (ext === '.npz') {
      return header.concat('Binary NumPy archive. Contents are not expanded in the text bundle.').join('\n');
    }
    const text = fs.readFileSync(file.full, 'utf8');
    if (ext === '.json') {
      return header.concat(`JSON shape: ${summarizeJsonValue(JSON.parse(text))}`).join('\n');
    }
    if (ext === '.ipynb') {
      return header.concat(summarizeNotebook(JSON.parse(text))).join('\n');
    }
    return header.concat(summarizeTextData(text)).join('\n');
  } catch (err) {
    return header.concat(`Could not summarize safely: ${err.message}`).join('\n');
  }
}

// ---------- configuration inspection ----------
const CONFIG_MAX_BYTES = 512 * 1024;
const CONFIG_EXACT_FILES = new Set([
  '.env', '.env.example', '.env.sample', '.env.template', '.env.local',
  '.npmrc', '.yarnrc', '.pypirc',
  'app.config', 'app.config.js', 'app.config.ts',
  'appsettings.json', 'local.settings.json', 'launchsettings.json',
  'application.yml', 'application.yaml', 'application.properties',
  'dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
  'firebase.json', 'vercel.json', 'netlify.toml', 'serverless.yml', 'serverless.yaml',
  'vite.config.js', 'vite.config.ts', 'next.config.js', 'next.config.mjs',
  'webpack.config.js', 'webpack.config.ts', 'angular.json',
  'tsconfig.json', 'jsconfig.json', 'nuget.config', 'web.config',
]);
const CONFIG_EXT = new Set(['.json', '.yml', '.yaml', '.toml', '.config', '.xml', '.properties', '.ini']);
const CONFIG_PATH_RE = /(^|[\\/])(?:config|configs|configuration|settings|environments?|secrets?|deploy|deployment)([\\/]|$)/i;
const CONFIG_KEY_RE = /(api[_-]?key|secret|token|password|passwd|pwd|connection[_-]?string|database[_-]?url|client[_-]?secret|client[_-]?id|tenant[_-]?id|issuer|audience|authority|endpoint|base[_-]?url|webhook|dsn|bucket|region|cloud|supabase|firebase|stripe|groq|openai|anthropic|aws|azure|gcp|s3|redis|mongo|postgres|mysql|smtp|oauth|jwt)/i;
const ENV_NAME_RE = /^[A-Z][A-Z0-9_]{2,}$/;

const configFiles = new Map();
const envRefs = new Map();
const configKeyRefs = new Map();

function addRef(map, key, rel) {
  if (!key) return;
  const normalized = String(key).trim().replace(/^["']|["']$/g, '');
  if (!normalized) return;
  if (!map.has(normalized)) map.set(normalized, new Set());
  map.get(normalized).add(rel);
}

function normalizeConfigKey(key) {
  return String(key || '').trim().replace(/^["']|["']$/g, '');
}

function isLikelyConfigFile(rel) {
  const normalized = rel.replace(/\\/g, '/');
  const name = path.basename(normalized).toLowerCase();
  if (CONFIG_EXACT_FILES.has(name)) return true;
  if (name.startsWith('.env')) return true;
  if (name.startsWith('appsettings.')) return true;
  if (name.includes('config') || name.includes('settings')) return true;
  if (CONFIG_PATH_RE.test(normalized)) return true;
  return CONFIG_EXT.has(path.extname(name).toLowerCase()) && CONFIG_PATH_RE.test(normalized);
}

function configKind(rel) {
  const name = path.basename(rel).toLowerCase();
  if (name.startsWith('.env')) return 'env template/key file';
  if (name.includes('appsettings') || name === 'local.settings.json') return '.NET settings';
  if (name.includes('docker')) return 'container/deploy config';
  if (name.includes('vite') || name.includes('next') || name.includes('webpack') || name === 'angular.json') return 'frontend build config';
  if (name === 'package.json') return 'npm metadata';
  if (name.endsWith('.csproj') || name === 'nuget.config') return '.NET package/config';
  return 'configuration';
}

function safeTextFile(rel, full, size) {
  if (size > CONFIG_MAX_BYTES) return '';
  const ext = path.extname(rel).toLowerCase();
  if (MEDIA_EXT.has(ext) || EXCLUDED_EXT.has(ext) && !CONFIG_EXT.has(ext)) return '';
  try {
    const buffer = fs.readFileSync(full);
    if (buffer.includes(0)) return '';
    return buffer.toString('utf8');
  } catch {
    return '';
  }
}

function walkJsonKeys(value, prefix, rel) {
  if (Array.isArray(value)) {
    value.slice(0, 20).forEach((item, index) => walkJsonKeys(item, `${prefix}[${index}]`, rel));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const current = prefix ? `${prefix}.${key}` : key;
    if (CONFIG_KEY_RE.test(key)) addRef(configKeyRefs, current, rel);
    walkJsonKeys(child, current, rel);
  }
}

function inspectEnvLikeLines(text, rel) {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
    const envMatch = trimmed.match(/^(?:export\s+)?([A-Z][A-Z0-9_]{2,})\s*=/);
    if (envMatch) addRef(envRefs, envMatch[1], rel);

    const keyMatch = trimmed.match(/^["']?([A-Za-z][A-Za-z0-9_.:-]*(?:key|secret|token|password|url|uri|endpoint|clientId|clientSecret|connectionString|databaseUrl|apiKey|projectId|bucket|region))["']?\s*[:=]/i);
    if (keyMatch) addRef(configKeyRefs, normalizeConfigKey(keyMatch[1]), rel);
  }
}

function inspectCodeEnvRefs(text, rel) {
  const patterns = [
    /\bprocess\.env\.([A-Z][A-Z0-9_]*)/g,
    /\bprocess\.env\[['"`]([A-Z][A-Z0-9_]*)['"`]\]/g,
    /\bimport\.meta\.env\.([A-Z][A-Z0-9_]*)/g,
    /\b(?:Deno\.env\.get|os\.getenv|getenv)\(\s*['"`]([A-Z][A-Z0-9_]*)['"`]/g,
    /\bos\.environ\[['"`]([A-Z][A-Z0-9_]*)['"`]\]/g,
    /\bConfiguration\[['"`]([^'"`\]]+)['"`]\]/g,
    /\bGetConnectionString\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const key = match[1];
      if (ENV_NAME_RE.test(key)) addRef(envRefs, key, rel);
      else addRef(configKeyRefs, key, rel);
    }
  }
}

function inspectConfiguration(rel, full, size) {
  const likelyConfig = isLikelyConfigFile(rel);
  const text = safeTextFile(rel, full, size);
  if (!text) return;

  if (likelyConfig) configFiles.set(rel, configKind(rel));
  inspectCodeEnvRefs(text, rel);
  if (likelyConfig) inspectEnvLikeLines(text, rel);

  if (likelyConfig && path.extname(rel).toLowerCase() === '.json') {
    try {
      walkJsonKeys(JSON.parse(text), '', rel);
    } catch {
      inspectEnvLikeLines(text, rel);
    }
  }
}

function refsMarkdown(map, limit = 80) {
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, files]) => `- \`${key}\` in ${[...files].sort().slice(0, 6).join(', ')}${files.size > 6 ? ` (+${files.size - 6} more)` : ''}`)
    .join('\n');
}

function formatConfigurationSummary() {
  const lines = [
    'Values are redacted. Real secret values and full `.env`/settings files are not copied into this summary.',
  ];

  if (configFiles.size) {
    lines.push('', '### Config files detected');
    for (const [rel, kind] of [...configFiles.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(0, 80)) {
      lines.push(`- ${rel} (${kind})`);
    }
  }

  if (envRefs.size) {
    lines.push('', '### Environment/API key references');
    lines.push(refsMarkdown(envRefs));
  }

  const publicEnv = [...envRefs.keys()].filter(key => /^(VITE_|NEXT_PUBLIC_|REACT_APP_|PUBLIC_)/.test(key)).sort();
  if (publicEnv.length) {
    lines.push('', '### Public frontend env keys');
    for (const key of publicEnv.slice(0, 60)) lines.push(`- \`${key}\``);
  }

  if (configKeyRefs.size) {
    lines.push('', '### Sensitive-looking config keys');
    lines.push(refsMarkdown(configKeyRefs));
  }

  if (lines.length === 1) lines.push('', '_No explicit config or integration key references detected._');
  return lines.join('\n');
}

// ---------- walk ----------
const collected = [];     // { rel, full, size }
const skippedLarge = [];  // { rel, size }
const skippedStyles = [];
const skippedMedia = [];

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

    let size = 0;
    try {
      size = fs.statSync(full).size;
    } catch {
      continue;
    }
    const rel = path.relative(ROOT, full);
    if (rel === path.join('brain', 'index.html')) continue;
    if (/^brain[\\/](?:projects|_repos|_runs|_staging)[\\/]/i.test(rel)) continue;
    inspectConfiguration(rel, full, size);
    const ext = path.extname(e.name).toLowerCase();
    if (!includeStyles && STYLE_EXT.has(ext)) {
      skippedStyles.push({ rel, size });
      continue;
    }
    if (MEDIA_EXT.has(ext)) {
      skippedMedia.push({ rel, size });
      continue;
    }
    if (isExcludedFile(e.name)) continue;
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
const summarizedFiles = collected.filter(shouldSummarizeFile);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
const stream = fs.createWriteStream(outPath, { flags: 'w' });
const FENCE = '````'; // 4 backticks so source files containing ``` don't break it

stream.write(`# Project Context: ${projectName}\n\n`);
stream.write(`- Generated: ${new Date().toISOString()}\n`);
stream.write(`- Source path: ${ROOT}\n`);
stream.write(`- Git URL: ${detectGitUrl()}\n`);
stream.write(`- Files included: ${collected.length}\n`);
stream.write(`- Files summarized (large data/notebooks): ${summarizedFiles.length}\n`);
stream.write(`- Files skipped (> ${maxKb} KB): ${skippedLarge.length}\n`);
stream.write(`- Style files ignored: ${skippedStyles.length}${includeStyles ? ' (style inclusion enabled)' : ''}\n`);
stream.write(`- Media/design assets ignored: ${skippedMedia.length}\n\n`);

stream.write(`## Detected stack & packages\n\n${detectStack()}\n\n`);
stream.write(`## Configuration & integrations\n\n${formatConfigurationSummary()}\n\n`);
stream.write(`## File type breakdown\n\n${extStats()}\n\n`);
stream.write(`## File tree\n\n\`\`\`\n${buildTree(collected.map(f => f.rel))}\n\`\`\`\n\n`);

if (skippedStyles.length) {
  stream.write(`## Ignored style files\n\n`);
  for (const s of skippedStyles.slice(0, 120)) stream.write(`- ${s.rel} (${Math.round(s.size / 1024)} KB)\n`);
  if (skippedStyles.length > 120) stream.write(`- ... ${skippedStyles.length - 120} more style file(s)\n`);
  stream.write('\n');
}

if (skippedMedia.length) {
  stream.write(`## Ignored media/design assets\n\n`);
  for (const s of skippedMedia.slice(0, 80)) stream.write(`- ${s.rel} (${Math.round(s.size / 1024)} KB)\n`);
  if (skippedMedia.length > 80) stream.write(`- ... ${skippedMedia.length - 80} more asset file(s)\n`);
  stream.write('\n');
}

if (skippedLarge.length) {
  stream.write(`## Skipped large files\n\n`);
  for (const s of skippedLarge) stream.write(`- ${s.rel} (${Math.round(s.size / 1024)} KB)\n`);
  stream.write('\n');
}

if (summarizedFiles.length) {
  stream.write(`## Summarized data/notebook files\n\n`);
  for (const s of summarizedFiles) stream.write(`- ${s.rel} (${Math.round(s.size / 1024)} KB)\n`);
  stream.write('\n');
}

stream.write(`## Source files\n`);
for (const f of collected) {
  const summary = summaryForFile(f);
  const lang = summary ? 'text' : (LANG[path.extname(f.rel).toLowerCase()] || '');
  stream.write(`\n### ${f.rel}\n\n`);
  stream.write(`${FENCE}${lang}\n`);
  if (summary) {
    stream.write(summary);
  } else {
    try {
      stream.write(fs.readFileSync(f.full, 'utf8'));
    } catch (err) {
      stream.write(`[ERROR READING FILE: ${err.message}]`);
    }
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
  if (summarizedFiles.length) console.log(`Summarized ${summarizedFiles.length} large data/notebook file(s).`);
  if (skippedLarge.length) console.log(`Skipped ${skippedLarge.length} large file(s).`);
});

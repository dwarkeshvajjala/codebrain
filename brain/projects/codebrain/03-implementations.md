# codeBrain - Key Implementations

## GitHub Import Orchestrator

`brain-import.js` accepts either a GitHub URL or a local folder. GitHub repos are cached under `brain/_repos/`; local folders are bundled directly.

```javascript
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
}
```

## Bundle-Only Fallback

When Groq is not configured, import still creates a useful project folder with `raw.context.md` and a minimal overview.

```javascript
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
`);
  }
}
```

## Source Bundling

`brain-bundle.js` skips common generated folders, large files, secrets, binary assets, and prior context files.

```javascript
const EXCLUDED_DIRS = new Set([
  'node_modules', 'bin', 'obj', 'dist', 'build', 'out', '.next', '.nuxt',
  '.turbo', '.cache', '.git', '.vs', '.vscode', '.idea', '.svelte-kit',
  'vendor', '__pycache__', '.pytest_cache', 'target', 'Pods', 'DerivedData',
  'coverage', '_repos', '_staging'
]);
```

## Git URL Capture

The bundler records either the import source URL or the repo's `origin` remote, so refined docs can cite the source.

```javascript
function detectGitUrl() {
  if (sourceUrl) return sourceUrl;
  try {
    return execFileSync('git', ['-C', ROOT, 'config', '--get', 'remote.origin.url'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'TODO';
  }
}
```

## Local `.env` Loading

`load-env.js` avoids a dependency on `dotenv` while letting scripts read local secrets safely.

```javascript
function loadEnv(file = path.resolve('.env')) {
  if (!fs.existsSync(file)) return;

  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = value;
  }
}
```

## Dashboard Generation

`brain-ui.js` loads each project folder, extracts markdown sections, and embeds the data into a single static HTML file.

```javascript
function loadProjects() {
  const projectsDir = path.join(brainDir, 'projects');
  if (!fs.existsSync(projectsDir)) return [];

  return fs.readdirSync(projectsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const projectDir = path.join(projectsDir, entry.name);
      const sections = {};
      for (const [fileKey, label] of SECTION_FILES) {
        const filename = fileKey === 'raw.context' ? 'raw.context.md' : `${fileKey}.md`;
        const content = readIfExists(path.join(projectDir, filename));
        if (content) sections[fileKey] = { label, content };
      }
      return { slug: entry.name, sections };
    });
}
```

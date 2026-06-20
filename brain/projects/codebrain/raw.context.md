# Project Context: codeBrain

- Generated: 2026-06-20T20:00:06.327Z
- Source path: D:\AI\codeBrain
- Git URL: https://github.com/dwarkeshvajjala/codebrain.git
- Files included: 25
- Files skipped (> 120 KB): 0

## Detected stack & packages

### npm - package.json
**name** code-brain
**dependencies**
- cors ^2.8.6
- express ^5.2.1
- react ^19.2.7
- react-dom ^19.2.7
**devDependencies**
- @vitejs/plugin-react ^6.0.2
- concurrently ^10.0.3
- vite ^8.0.16

## File type breakdown

- .md: 10
- .js: 9
- (none): 2
- .html: 1
- .jsx: 1
- .css: 1
- .json: 1

## File tree

```
|-- .gitignore
|-- SETUP.md
|-- brain
|   |-- README.md
|   |-- ideas
|   |   `-- _TEMPLATE.md
|   |-- patterns
|   |   |-- README.md
|   |   `-- _TEMPLATE.md
|   `-- projects
|       |-- .gitkeep
|       `-- codebrain
|           |-- 00-overview.md
|           |-- 01-architecture.md
|           |-- 02-packages.md
|           |-- 03-implementations.md
|           `-- 04-gotchas.md
|-- client
|   |-- index.html
|   `-- src
|       |-- main.jsx
|       `-- styles.css
|-- package.json
|-- scripts
|   |-- brain-all.js
|   |-- brain-bundle.js
|   |-- brain-import.js
|   |-- brain-refine.js
|   |-- brain-ui.js
|   |-- load-env.js
|   `-- new-idea.js
|-- server
|   `-- index.js
`-- vite.config.js
```

## Source files

### .gitignore

````
# staging for batch runs (context files are regenerated)
brain/_staging/
brain/_repos/
brain/_runs/
dist/

# secrets
.env
*.env

# node
node_modules/

# local server logs
brain-server*.log
api*.log
client*.log

# OS
.DS_Store
Thumbs.db

````

### brain\ideas\_TEMPLATE.md

````markdown
# <idea title>

## Problem / why
- 

## Core idea
- 

## Suggested stack
- 

## Build phases
- Phase 1: 
- Phase 2: 

## Reuse from existing projects
- 

## Risks / open questions
- 

## First concrete step
- 

````

### brain\patterns\_TEMPLATE.md

````markdown
# Pattern: <name>

> A reusable approach you keep needing across projects. Write these by hand — they become your highest-value layer.

## Problem it solves
- 

## When to use it
- 

## Working code
```text
// paste the real, tested snippet here
```

## Gotchas
- 

## Used in
- <project> (link to projects/<project>/03-implementations.md)

````

### brain\patterns\README.md

````markdown
# Patterns

Cross-project reusable solutions. Unlike `projects/` (auto-generated), write these by hand when you notice you've solved the same thing twice.

Good candidates from your stack:
- `auth-jwt-httponly.md` — JWT access + HttpOnly refresh token flow
- `nl2sql-groq.md` — natural-language-to-SQL with Groq
- `supabase-realtime.md` — live updates (e.g. seat maps)
- `magic-link-auth.md` — passwordless candidate login
- `groq-whisper-transcription.md` — audio → text

Copy `_TEMPLATE.md` to start a new one.

````

### brain\projects\.gitkeep

````

````

### brain\projects\codebrain\00-overview.md

````markdown
# codeBrain - Overview

- Personal code-memory tool that turns repos into structured markdown knowledge.
- Primary workflow: import a GitHub repo or local folder, bundle source context, refine it with Groq, then browse/upload the generated markdown.
- Tech stack: dependency-free Node.js scripts, Markdown files, generated static HTML dashboard.
- Storage model: `brain/projects/<project>/` holds the useful project notes; `_staging` and `_repos` are generated cache folders.
- UI model: `brain/index.html` is regenerated from local markdown and can be opened directly or served locally.
- Status: functional CLI pipeline with GitHub import, local `.env` loading, bundle-only fallback, AI refine, dashboard generation, ideas, and patterns.
- Git URL: https://github.com/dwarkeshvajjala/codebrain.git

## Main Commands

- `npm run import -- https://github.com/owner/repo`: clone/update, bundle, refine, and rebuild dashboard.
- `npm run import -- . --maxchars 30000 --maxkb 80`: import the current local repo with a smaller Groq context.
- `npm run import -- <repo> --bundle-only`: create raw context without Groq.
- `npm run ui`: regenerate `brain/index.html`.
- `npm run bundle -- <repo>`: create one raw context markdown file.
- `npm run refine -- <context.md>`: turn raw context into five brain markdown files.
- `npm run idea -- "Idea title"`: create a new idea plan using existing brain context.

## Generated Project Files

- `00-overview.md`
- `01-architecture.md`
- `02-packages.md`
- `03-implementations.md`
- `04-gotchas.md`
- `raw.context.md`

````

### brain\projects\codebrain\01-architecture.md

````markdown
# codeBrain - Architecture

## Folder Layout

- `scripts/`: all executable CLI tools.
- `scripts/brain-import.js`: highest-level entry point for GitHub URLs and local folders.
- `scripts/brain-bundle.js`: walks a repo and writes one source-context markdown file.
- `scripts/brain-refine.js`: sends bundled context to Groq and writes project notes.
- `scripts/brain-ui.js`: reads `brain/projects/*` and generates the dashboard.
- `scripts/brain-all.js`: batch pipeline for every repo under one parent folder.
- `scripts/new-idea.js`: creates idea documents under `brain/ideas/`.
- `scripts/load-env.js`: minimal dependency-free `.env` loader.
- `brain/projects/`: one generated knowledge folder per project.
- `brain/patterns/`: hand-written reusable implementation patterns.
- `brain/ideas/`: dated idea plans.
- `brain/index.html`: generated static dashboard.
- `SETUP.md`: user-facing operating guide.

## Pipeline Flow

```text
GitHub URL or local repo
  -> brain-import.js
  -> brain-bundle.js
  -> brain/_staging/<repo>.context.md
  -> brain-refine.js + Groq
  -> brain/projects/<repo>/00..04.md + raw.context.md
  -> brain-ui.js
  -> brain/README.md + brain/index.html
```

## Bundle-Only Flow

```text
GitHub URL or local repo
  -> brain-import.js --bundle-only
  -> brain-bundle.js
  -> brain/projects/<repo>/raw.context.md
  -> fallback 00-overview.md
  -> brain-ui.js
```

## Data Boundaries

- Real secrets belong only in local `.env`.
- `.env.example` is tracked and safe to commit.
- `brain/_repos/` caches cloned GitHub repos and is ignored.
- `brain/_staging/` stores regenerated context files and is ignored.
- The useful project knowledge is committed under `brain/projects/`.

````

### brain\projects\codebrain\02-packages.md

````markdown
# codeBrain - Packages

## Runtime Dependencies

- No npm runtime dependencies.
- The project intentionally uses Node built-ins only:
  - `fs` for file reads/writes.
  - `path` for cross-platform paths.
  - `child_process` for calling Git and local scripts.
  - built-in `fetch` for Groq API calls.

## External Tools

- `git`: required for cloning/updating GitHub repositories.
- Node.js 18+: required because scripts rely on built-in `fetch`.
- Groq API: required for AI refinement and idea generation.

## Why This Matters

- Setup stays simple: clone repo, set `.env`, run npm scripts.
- The dashboard is static HTML, so there is no dev server or frontend build step.
- No package install is required unless future work adds a real web app/server.

````

### brain\projects\codebrain\03-implementations.md

````markdown
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

````

### brain\projects\codebrain\04-gotchas.md

````markdown
# codeBrain - Decisions & Gotchas

## Decisions

- Keep the project dependency-free so it works immediately after cloning.
- Store the knowledge base as markdown first; this keeps it portable for Claude Projects, GitHub, and future RAG ingestion.
- Generate `brain/index.html` as a static dashboard instead of running a frontend app.
- Keep real repo clones under `brain/_repos/` so repeated GitHub imports can update instead of recloning.
- Keep raw bundle files under `brain/_staging/` so expensive context files can be regenerated.
- Track `.env.example`, but never track real `.env`.

## Gotchas

- Groq free/on-demand tiers may reject large contexts. Use `--maxchars 30000` or lower if you hit token limits.
- `--bundle-only` is useful when you do not have a key, but it creates only raw context plus a minimal overview.
- If you import the current `codeBrain` repo, use a smaller `--maxkb` so generated dashboard files do not dominate the context.
- The dashboard searches project markdown content, not only project names, so broad terms may match more projects than expected.
- `brain/index.html` is generated. Edit `scripts/brain-ui.js`, then run `npm run ui`.
- `brain/README.md` is generated. It will be overwritten by refine/import/UI commands.
- GitHub privacy cannot be changed by these scripts; use GitHub settings, GitHub CLI, or the GitHub API with an admin token.

## Safe Secret Handling

- Put the real Groq key only in local `.env`.
- Commit `.env.example`, not `.env`.
- Before pushing, run:

```bash
rg "GROQ_API_KEY|your_groq_key_here" -n .
git status --short
```

````

### brain\README.md

````markdown
# Code Brain - Index

> Personal knowledge base of shipped projects. This file is regenerated automatically.

| Project | Summary |
| --- | --- |
| [codebrain](./projects/codebrain/00-overview.md) | Personal code-memory tool that turns repos into structured markdown knowledge. |

## Folders
- `projects/` - one folder per project (00 overview to 04 gotchas + raw context)
- `patterns/` - cross-project reusable patterns
- `ideas/` - new ideas, dated YYYY-MM-DD

## Dashboard
- Open `brain/index.html` for the easier visual browser.

````

### client\index.html

````html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Code Brain</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

````

### client\src\main.jsx

````jsx
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const SECTION_ORDER = [
  '00-overview',
  '01-architecture',
  '02-packages',
  '03-implementations',
  '04-gotchas',
  'raw.context',
];

const SECTION_LABELS = {
  '00-overview': 'Overview',
  '01-architecture': 'Architecture',
  '02-packages': 'Packages',
  '03-implementations': 'Implementations',
  '04-gotchas': 'Gotchas',
  'raw.context': 'Raw Context',
};

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function markdownToHtml(markdown = '') {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inCode = false;
  let listOpen = false;
  let table = [];

  const closeList = () => {
    if (listOpen) html.push('</ul>');
    listOpen = false;
  };

  const flushTable = () => {
    if (!table.length) return;
    html.push('<table>');
    table.forEach((row, index) => {
      if (/^\s*\|?\s*:?-{3,}/.test(row)) return;
      const cells = row.trim().replace(/^\||\|$/g, '').split('|').map(cell => inlineMarkdown(cell.trim()));
      html.push('<tr>' + cells.map(cell => index === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`).join('') + '</tr>');
    });
    html.push('</table>');
    table = [];
  };

  for (const line of lines) {
    if (/^`{3,4}/.test(line)) {
      flushTable();
      closeList();
      html.push(inCode ? '</code></pre>' : '<pre><code>');
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }

    if (/^\|.+\|$/.test(line.trim())) {
      closeList();
      table.push(line);
      continue;
    }

    flushTable();
    if (!line.trim()) {
      closeList();
      continue;
    }
    if (line.startsWith('### ')) {
      closeList();
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      closeList();
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      closeList();
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      if (!listOpen) html.push('<ul>');
      listOpen = true;
      html.push(`<li>${inlineMarkdown(line.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }
    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  flushTable();
  closeList();
  if (inCode) html.push('</code></pre>');
  return html.join('\n');
}

function BrainMark() {
  return (
    <div className="brain-mark" aria-hidden="true">
      <span className="node node-a" />
      <span className="node node-b" />
      <span className="node node-c" />
      <span className="node node-d" />
      <span className="bridge bridge-a" />
      <span className="bridge bridge-b" />
      <span className="bridge bridge-c" />
    </div>
  );
}

function App() {
  const [health, setHealth] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [selectedSection, setSelectedSection] = useState('00-overview');
  const [repoUrl, setRepoUrl] = useState('');
  const [cleanup, setCleanup] = useState(true);
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  async function loadProjects(nextSlug) {
    const data = await api('/api/projects');
    setProjects(data.projects);
    if (nextSlug) setSelectedSlug(nextSlug);
    else if (!selectedSlug && data.projects[0]) setSelectedSlug(data.projects[0].slug);
  }

  useEffect(() => {
    api('/api/health').then(setHealth).catch(err => setError(err.message));
    loadProjects().catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!job || !['queued', 'running'].includes(job.status)) return undefined;
    const timer = setInterval(async () => {
      try {
        const data = await api(`/api/jobs/${job.id}`);
        setJob(data.job);
        if (data.job.status === 'complete') await loadProjects(data.job.slug);
      } catch (err) {
        setError(err.message);
      }
    }, 1200);
    return () => clearInterval(timer);
  }, [job]);

  const selectedProject = projects.find(project => project.slug === selectedSlug) || projects[0];
  const sections = selectedProject?.sections || [];
  const section = sections.find(item => item.key === selectedSection) || sections[0];

  const filteredProjects = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter(project => {
      const text = [
        project.title,
        project.summary,
        ...project.sections.map(item => item.content),
      ].join('\n').toLowerCase();
      return text.includes(needle);
    });
  }, [projects, query]);

  async function submitImport(event) {
    event.preventDefault();
    setError('');
    setJob(null);
    try {
      const data = await api('/api/import', {
        method: 'POST',
        body: JSON.stringify({ repoUrl, cleanup, maxChars: 30000, maxKb: 120 }),
      });
      setJob(data.job);
    } catch (err) {
      setError(err.message);
    }
  }

  function selectProject(slug) {
    setSelectedSlug(slug);
    setSelectedSection('00-overview');
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <BrainMark />
          <div>
            <p className="eyebrow">Local code memory</p>
            <h1>Code Brain</h1>
          </div>
        </div>

        <form className="import-card" onSubmit={submitImport}>
          <label htmlFor="repoUrl">GitHub repo URL</label>
          <div className="url-row">
            <input
              id="repoUrl"
              value={repoUrl}
              onChange={event => setRepoUrl(event.target.value)}
              placeholder="https://github.com/owner/repo"
            />
            <button type="submit" disabled={!repoUrl || job?.status === 'running'}>Import</button>
          </div>
          <label className="check-row">
            <input type="checkbox" checked={cleanup} onChange={event => setCleanup(event.target.checked)} />
            Delete cloned repo automatically after markdown is generated
          </label>
          <p className="hint">
            The backend clones, bundles, refines with Groq, writes markdown, refreshes the brain, then removes the temp clone.
          </p>
        </form>

        <div className="status-strip">
          <span className={health?.groqConfigured ? 'dot ok' : 'dot warn'} />
          {health?.groqConfigured ? 'Groq key loaded' : 'Groq key missing'}
        </div>

        <input
          className="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search brain"
        />

        <div className="project-list">
          {filteredProjects.map(project => (
            <button
              key={project.slug}
              className={`project-btn ${project.slug === selectedProject?.slug ? 'active' : ''}`}
              onClick={() => selectProject(project.slug)}
            >
              <strong>{project.title}</strong>
              <span>{project.summary}</span>
            </button>
          ))}
          {!filteredProjects.length && <p className="empty-note">No projects match.</p>}
        </div>
      </aside>

      <section className="workspace">
        <header className="hero">
          <div>
            <p className="eyebrow">Autonomous markdown generation</p>
            <h2>Paste a repo. Grow the brain.</h2>
            <p>
              Code Brain turns repos into overview, architecture, package, implementation, gotcha, and raw-context markdown files.
            </p>
          </div>
          <div className="metrics">
            <span>{projects.length}</span>
            <small>project{projects.length === 1 ? '' : 's'} indexed</small>
          </div>
        </header>

        {error && <div className="notice error">{error}</div>}

        {job && (
          <section className={`job-panel ${job.status}`}>
            <div className="job-head">
              <div>
                <strong>{job.step}</strong>
                <span>{job.repoUrl}</span>
              </div>
              <b>{job.status}</b>
            </div>
            <pre>{job.logs.slice(-18).join('\n') || 'Starting...'}</pre>
          </section>
        )}

        <section className="brain-panel">
          {selectedProject ? (
            <>
              <div className="project-head">
                <div>
                  <p className="eyebrow">Brain project</p>
                  <h2>{selectedProject.title}</h2>
                  <p>{selectedProject.summary}</p>
                </div>
              </div>

              <nav className="tabs">
                {SECTION_ORDER
                  .filter(key => sections.some(item => item.key === key))
                  .map(key => (
                    <button
                      key={key}
                      className={key === section?.key ? 'active' : ''}
                      onClick={() => setSelectedSection(key)}
                    >
                      {SECTION_LABELS[key] || key}
                    </button>
                  ))}
              </nav>

              <article className="markdown" dangerouslySetInnerHTML={{ __html: markdownToHtml(section?.content || '') }} />
            </>
          ) : (
            <div className="empty-state">
              <BrainMark />
              <h2>No brain projects yet</h2>
              <p>Paste a GitHub URL to generate the first markdown knowledge folder.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);

````

### client\src\styles.css

````css
:root {
  color-scheme: light;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #f6f7f2;
  color: #191b16;
  --ink: #191b16;
  --muted: #667064;
  --line: #dfe2d8;
  --panel: #ffffff;
  --panel-2: #eef3eb;
  --accent: #2e6f5f;
  --accent-dark: #184d42;
  --accent-soft: #dceee7;
  --danger: #9b2d24;
  --code: #151812;
  --code-ink: #edf3ea;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  background:
    radial-gradient(circle at 15% 8%, rgba(46, 111, 95, .14), transparent 30rem),
    radial-gradient(circle at 86% 12%, rgba(141, 171, 86, .13), transparent 26rem),
    linear-gradient(180deg, #fbfcf8, #f3f5ef);
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(310px, 380px) minmax(0, 1fr);
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 24px;
  border-right: 1px solid var(--line);
  background: rgba(255, 255, 255, .78);
  backdrop-filter: blur(16px);
  overflow: auto;
}

.workspace {
  min-width: 0;
  padding: 28px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
}

.brand h1,
.hero h2,
.project-head h2,
.empty-state h2 {
  margin: 0;
  letter-spacing: 0;
}

.brand h1 {
  font-size: 25px;
}

.eyebrow {
  margin: 0 0 5px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.brain-mark {
  position: relative;
  width: 68px;
  height: 54px;
  border-radius: 8px;
  background: linear-gradient(135deg, #e8f3ed, #cfe8dc);
  border: 1px solid #b9d8cb;
  box-shadow: inset 0 0 0 6px rgba(255, 255, 255, .45);
  flex: 0 0 auto;
}

.brain-mark::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 7px;
  bottom: 7px;
  width: 1px;
  background: rgba(46, 111, 95, .32);
}

.node,
.bridge {
  position: absolute;
  display: block;
}

.node {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 4px rgba(46, 111, 95, .14);
}

.node-a { left: 15px; top: 13px; }
.node-b { right: 16px; top: 12px; }
.node-c { left: 21px; bottom: 12px; }
.node-d { right: 20px; bottom: 13px; }

.bridge {
  height: 2px;
  background: rgba(46, 111, 95, .4);
  transform-origin: left center;
}

.bridge-a { left: 26px; top: 21px; width: 24px; transform: rotate(-3deg); }
.bridge-b { left: 30px; top: 32px; width: 19px; transform: rotate(-27deg); }
.bridge-c { left: 28px; top: 27px; width: 22px; transform: rotate(25deg); }

.import-card,
.job-panel,
.brain-panel,
.hero {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(255, 255, 255, .84);
}

.import-card {
  padding: 16px;
  margin-bottom: 14px;
}

.import-card label {
  display: block;
  color: var(--ink);
  font-size: 13px;
  font-weight: 750;
  margin-bottom: 8px;
}

.url-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.url-row input,
.search {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 11px;
  outline: none;
  background: #fff;
  color: var(--ink);
}

.url-row input:focus,
.search:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.url-row button,
.tabs button {
  border: 1px solid var(--accent);
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  padding: 10px 13px;
  font-weight: 750;
}

.url-row button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.check-row {
  display: flex !important;
  align-items: flex-start;
  gap: 8px;
  margin: 12px 0 0;
  color: var(--muted) !important;
  font-weight: 650 !important;
}

.check-row input {
  margin-top: 3px;
}

.hint {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.45;
}

.status-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 13px;
  margin-bottom: 14px;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.dot.ok { background: #2e7d4f; }
.dot.warn { background: #c18224; }

.search {
  margin-bottom: 14px;
}

.project-list {
  display: grid;
  gap: 10px;
}

.project-btn {
  text-align: left;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  padding: 12px;
}

.project-btn:hover,
.project-btn.active {
  border-color: #9fc7b8;
  background: var(--accent-soft);
}

.project-btn strong {
  display: block;
  margin-bottom: 5px;
}

.project-btn span,
.empty-note {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.4;
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 24px;
  margin: 0 auto 18px;
  max-width: 1180px;
}

.hero h2 {
  font-size: 34px;
  margin-bottom: 8px;
}

.hero p,
.project-head p {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.metrics {
  min-width: 116px;
  align-self: stretch;
  border-radius: 8px;
  background: var(--accent-soft);
  display: grid;
  place-content: center;
  text-align: center;
}

.metrics span {
  font-size: 32px;
  font-weight: 850;
  color: var(--accent-dark);
}

.metrics small {
  color: var(--muted);
}

.notice,
.job-panel,
.brain-panel {
  max-width: 1180px;
  margin: 0 auto 18px;
}

.notice {
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #efc2bd;
  color: var(--danger);
  background: #fff4f2;
}

.job-panel {
  padding: 16px;
}

.job-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.job-head strong,
.job-head span {
  display: block;
}

.job-head span {
  color: var(--muted);
  font-size: 13px;
  margin-top: 4px;
}

.job-head b {
  color: var(--accent-dark);
  text-transform: uppercase;
  font-size: 12px;
}

.job-panel pre {
  margin: 0;
  max-height: 250px;
  overflow: auto;
  border-radius: 8px;
  background: var(--code);
  color: var(--code-ink);
  padding: 14px;
  font-size: 12px;
  line-height: 1.5;
}

.brain-panel {
  padding: 24px;
}

.project-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.project-head h2 {
  font-size: 27px;
  margin-bottom: 7px;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.tabs button {
  background: #fff;
  color: var(--ink);
  border-color: var(--line);
}

.tabs button.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.markdown {
  overflow-wrap: anywhere;
  line-height: 1.64;
}

.markdown h1,
.markdown h2,
.markdown h3 {
  line-height: 1.25;
  letter-spacing: 0;
}

.markdown h1 {
  font-size: 28px;
  margin: 0 0 16px;
}

.markdown h2 {
  font-size: 21px;
  margin: 28px 0 10px;
}

.markdown h3 {
  font-size: 17px;
  margin: 22px 0 8px;
}

.markdown p {
  margin: 9px 0;
}

.markdown ul {
  padding-left: 22px;
}

.markdown li {
  margin: 6px 0;
}

.markdown code {
  border-radius: 5px;
  background: var(--panel-2);
  padding: 2px 5px;
  font-size: .92em;
}

.markdown pre {
  margin: 15px 0;
  padding: 16px;
  border-radius: 8px;
  background: var(--code);
  color: var(--code-ink);
  overflow: auto;
}

.markdown pre code {
  padding: 0;
  background: transparent;
  color: inherit;
}

.markdown table {
  width: 100%;
  display: block;
  overflow-x: auto;
  border-collapse: collapse;
  margin: 16px 0;
}

.markdown th,
.markdown td {
  border: 1px solid var(--line);
  padding: 8px 10px;
  text-align: left;
}

.empty-state {
  min-height: 420px;
  display: grid;
  place-items: center;
  align-content: center;
  text-align: center;
  gap: 14px;
  color: var(--muted);
}

.empty-state .brain-mark {
  width: 96px;
  height: 76px;
}

@media (max-width: 900px) {
  .shell {
    display: block;
  }

  .sidebar {
    position: relative;
    height: auto;
  }

  .workspace {
    padding: 20px;
  }

  .hero,
  .project-head,
  .job-head {
    display: block;
  }

  .metrics {
    margin-top: 16px;
    padding: 14px;
  }

  .url-row {
    grid-template-columns: 1fr;
  }
}

````

### package.json

````json
{
  "name": "code-brain",
  "version": "1.0.0",
  "description": "Personal RAG-style knowledge base built from your own shipped repos.",
  "private": true,
  "type": "commonjs",
  "engines": {
    "node": ">=18"
  },
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "client": "vite --host 127.0.0.1 --port 5173",
    "server": "node server/index.js",
    "build": "vite build",
    "start": "node server/index.js",
    "bundle": "node scripts/brain-bundle.js",
    "import": "node scripts/brain-import.js",
    "refine": "node scripts/brain-refine.js",
    "all": "node scripts/brain-all.js",
    "idea": "node scripts/new-idea.js",
    "ui": "node scripts/brain-ui.js",
    "serve": "node server/index.js"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^6.0.2",
    "concurrently": "^10.0.3",
    "vite": "^8.0.16"
  },
  "dependencies": {
    "cors": "^2.8.6",
    "express": "^5.2.1",
    "react": "^19.2.7",
    "react-dom": "^19.2.7"
  }
}

````

### scripts\brain-all.js

````javascript
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
 *   node brain-all.js ./all-my-repos --maxkb 200 --maxchars 200000
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
  --maxchars N    Limit context sent to the model. Default: 120000.
  -h, --help      Show this help.`;

const args = process.argv.slice(2);
let parentDir = null;
let brainDir = path.resolve('./brain');
let model = 'llama-3.3-70b-versatile';
let maxKb = 250;
let maxChars = 120000;
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

````

### scripts\brain-bundle.js

````javascript
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

````

### scripts\brain-import.js

````javascript
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
  --maxchars N    Limit context sent to the model. Default: 120000.
  --fresh         Delete the cached clone before importing.
  -h, --help      Show this help.`;

const args = process.argv.slice(2);
let source = null;
let brainDir = path.resolve('./brain');
let model = 'llama-3.3-70b-versatile';
let maxKb = 250;
let maxChars = 120000;
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

````

### scripts\brain-refine.js

````javascript
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

````

### scripts\brain-ui.js

````javascript
#!/usr/bin/env node
/**
 * Generate a dependency-free dashboard for browsing the local code brain.
 *
 * Usage:
 *   node scripts/brain-ui.js
 *   node scripts/brain-ui.js --out ./brain
 */

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node scripts/brain-ui.js [--out ./brain]

Options:
  --out dir     Brain folder. Default: ./brain.
  -h, --help    Show this help.`;

const args = process.argv.slice(2);
let brainDir = path.resolve('./brain');

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
  else {
    console.error(`Unknown option: ${a}\n\n${USAGE}`);
    process.exit(1);
  }
}

const SECTION_FILES = [
  ['00-overview', 'Overview'],
  ['01-architecture', 'Architecture'],
  ['02-packages', 'Packages'],
  ['03-implementations', 'Implementations'],
  ['04-gotchas', 'Gotchas'],
  ['raw.context', 'Raw Context'],
];

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function extractTitle(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function extractSummary(markdown) {
  const lines = markdown.split(/\r?\n/).map(line => line.trim());
  const bullet = lines.find(line => line.startsWith('- ') && line.length > 2);
  if (bullet) return bullet.replace(/^-\s*/, '').slice(0, 180);
  const text = lines.find(line => line && !line.startsWith('#'));
  return text ? text.slice(0, 180) : 'No summary yet.';
}

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
      const overview = sections['00-overview']?.content || '';
      return {
        slug: entry.name,
        title: extractTitle(overview, entry.name).replace(/\s+-\s+Overview$/i, ''),
        summary: extractSummary(overview),
        sections,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function rebuildMarkdownIndex(projects) {
  fs.mkdirSync(brainDir, { recursive: true });
  const rows = projects.map(project =>
    `| [${project.slug}](./projects/${project.slug}/00-overview.md) | ${project.summary.replace(/\|/g, '\\|')} |`
  );
  const out = `# Code Brain - Index

> Personal knowledge base of shipped projects. This file is regenerated automatically.

| Project | Summary |
| --- | --- |
${rows.join('\n')}

## Folders
- \`projects/\` - one folder per project (00 overview to 04 gotchas + raw context)
- \`patterns/\` - cross-project reusable patterns
- \`ideas/\` - new ideas, dated YYYY-MM-DD

## Dashboard
- Open \`brain/index.html\` for the easier visual browser.
`;
  fs.writeFileSync(path.join(brainDir, 'README.md'), out);
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function html(projects) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Code Brain</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f7f3;
      --ink: #191a16;
      --muted: #6b6f64;
      --line: #deded4;
      --panel: #ffffff;
      --panel-2: #efefe6;
      --accent: #2f6f5e;
      --accent-2: #d8ebe4;
      --code: #171914;
      --code-ink: #edf2e9;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      background:
        radial-gradient(circle at 18% 12%, rgba(47, 111, 94, .12), transparent 28rem),
        linear-gradient(180deg, #fbfbf7, var(--bg));
    }
    button, input { font: inherit; }
    .app {
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
    }
    aside {
      position: sticky;
      top: 0;
      height: 100vh;
      padding: 24px;
      border-right: 1px solid var(--line);
      background: rgba(255,255,255,.72);
      backdrop-filter: blur(14px);
      overflow: auto;
    }
    main {
      min-width: 0;
      padding: 28px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .mark {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      background:
        linear-gradient(90deg, transparent 47%, rgba(255,255,255,.52) 48% 52%, transparent 53%),
        radial-gradient(circle at 30% 28%, #9cd3bd 0 15%, transparent 16%),
        radial-gradient(circle at 68% 34%, #7ab7a3 0 15%, transparent 16%),
        radial-gradient(circle at 48% 70%, #2f6f5e 0 18%, transparent 19%),
        #d8ebe4;
      border: 1px solid #b7d7cb;
      box-shadow: inset 0 0 0 5px rgba(255,255,255,.38);
    }
    h1 { margin: 0; font-size: 22px; letter-spacing: 0; }
    .sub { margin: 3px 0 0; color: var(--muted); font-size: 13px; }
    .search {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 11px 12px;
      background: var(--panel);
      color: var(--ink);
      outline: none;
    }
    .search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-2); }
    .project-list {
      display: grid;
      gap: 10px;
      margin-top: 18px;
    }
    .project-btn {
      text-align: left;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      background: var(--panel);
      cursor: pointer;
    }
    .project-btn:hover, .project-btn.active {
      border-color: #9fc8ba;
      background: var(--accent-2);
    }
    .project-name { display: block; font-weight: 750; margin-bottom: 4px; }
    .project-summary { color: var(--muted); font-size: 13px; line-height: 1.4; }
    .topbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      max-width: 1120px;
      margin: 0 auto 18px;
    }
    .title h2 { margin: 0 0 6px; font-size: 30px; letter-spacing: 0; }
    .title p { margin: 0; color: var(--muted); line-height: 1.5; }
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }
    .action, .tab {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      padding: 9px 11px;
      cursor: pointer;
      color: var(--ink);
      text-decoration: none;
    }
    .action:hover, .tab:hover { border-color: #9fc8ba; }
    .tabs {
      max-width: 1120px;
      margin: 0 auto 14px;
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 3px;
    }
    .tab.active {
      background: var(--accent);
      border-color: var(--accent);
      color: white;
    }
    .content {
      max-width: 1120px;
      margin: 0 auto;
      background: rgba(255,255,255,.82);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 26px;
      overflow: hidden;
    }
    .empty {
      color: var(--muted);
      padding: 28px;
      text-align: center;
      border: 1px dashed var(--line);
      border-radius: 8px;
      background: rgba(255,255,255,.6);
    }
    .md { line-height: 1.62; overflow-wrap: anywhere; }
    .md h1, .md h2, .md h3 { line-height: 1.22; letter-spacing: 0; }
    .md h1 { font-size: 28px; margin: 0 0 18px; }
    .md h2 { font-size: 21px; margin: 28px 0 10px; }
    .md h3 { font-size: 17px; margin: 22px 0 8px; }
    .md p { margin: 9px 0; }
    .md ul { padding-left: 22px; }
    .md li { margin: 6px 0; }
    .md code {
      border-radius: 5px;
      background: var(--panel-2);
      padding: 2px 5px;
      font-size: .92em;
    }
    .md pre {
      margin: 14px 0;
      padding: 16px;
      border-radius: 8px;
      overflow: auto;
      background: var(--code);
      color: var(--code-ink);
    }
    .md pre code {
      padding: 0;
      background: transparent;
      color: inherit;
    }
    .md table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
      display: block;
      overflow-x: auto;
    }
    .md th, .md td { border: 1px solid var(--line); padding: 8px 10px; text-align: left; }
    .md blockquote {
      margin: 14px 0;
      padding: 8px 14px;
      border-left: 4px solid var(--accent);
      color: var(--muted);
      background: var(--accent-2);
    }
    @media (max-width: 820px) {
      .app { display: block; }
      aside { position: relative; height: auto; }
      main { padding: 20px; }
      .topbar { display: block; }
      .actions { justify-content: flex-start; margin-top: 14px; }
      .content { padding: 18px; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside>
      <div class="brand">
        <div class="mark" aria-hidden="true"></div>
        <div>
          <h1>Code Brain</h1>
          <p class="sub">Projects, patterns, and reusable implementation memory.</p>
        </div>
      </div>
      <input id="search" class="search" type="search" placeholder="Search projects or markdown">
      <div id="projectList" class="project-list"></div>
    </aside>
    <main>
      <section class="topbar">
        <div class="title">
          <h2 id="projectTitle">No projects yet</h2>
          <p id="projectSummary">Import a repository to generate markdown knowledge files.</p>
        </div>
        <div class="actions">
          <button class="action" id="copyImport">Copy import command</button>
          <button class="action" id="copyUpload">Copy Claude upload checklist</button>
        </div>
      </section>
      <nav id="tabs" class="tabs"></nav>
      <article id="content" class="content empty">Run <code>npm run import -- &lt;github-url&gt;</code> or <code>npm run all -- &lt;repos-folder&gt;</code>.</article>
    </main>
  </div>
  <script>
    const PROJECTS = ${safeJson(projects)};
    let selectedProject = PROJECTS[0]?.slug || '';
    let selectedSection = '00-overview';

    const el = {
      list: document.getElementById('projectList'),
      search: document.getElementById('search'),
      title: document.getElementById('projectTitle'),
      summary: document.getElementById('projectSummary'),
      tabs: document.getElementById('tabs'),
      content: document.getElementById('content'),
      copyImport: document.getElementById('copyImport'),
      copyUpload: document.getElementById('copyUpload'),
    };

    function escapeHtml(text) {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function inline(text) {
      return escapeHtml(text)
        .replace(new RegExp('\\\\x60([^\\\\x60]+)\\\\x60', 'g'), '<code>$1</code>')
        .replace(new RegExp('\\\\*\\\\*([^*]+)\\\\*\\\\*', 'g'), '<strong>$1</strong>')
        .replace(new RegExp('\\\\[([^\\\\]]+)\\\\]\\\\(([^)]+)\\\\)', 'g'), '<a href="$2">$1</a>');
    }

    function renderMarkdown(md) {
      const lines = md.split(/\\r?\\n/);
      const out = [];
      let inCode = false;
      let listOpen = false;
      let table = [];

      function closeList() {
        if (listOpen) out.push('</ul>');
        listOpen = false;
      }

      function flushTable() {
        if (!table.length) return;
        out.push('<table>');
        table.forEach((row, index) => {
          if (/^\\s*\\|?\\s*:?-{3,}/.test(row)) return;
          const cells = row.trim().replace(/^\\||\\|$/g, '').split('|').map(cell => inline(cell.trim()));
          out.push('<tr>' + cells.map(cell => index === 0 ? '<th>' + cell + '</th>' : '<td>' + cell + '</td>').join('') + '</tr>');
        });
        out.push('</table>');
        table = [];
      }

      for (const line of lines) {
        const fence = line.match(new RegExp('^\\\\x60{3,4}\\\\w*'));
        if (fence) {
          flushTable();
          closeList();
          if (!inCode) out.push('<pre><code>');
          else out.push('</code></pre>');
          inCode = !inCode;
          continue;
        }
        if (inCode) {
          out.push(escapeHtml(line) + '\\n');
          continue;
        }
        if (/^\\|.+\\|$/.test(line.trim())) {
          closeList();
          table.push(line);
          continue;
        }
        flushTable();
        if (!line.trim()) {
          closeList();
          continue;
        }
        if (line.startsWith('### ')) { closeList(); out.push('<h3>' + inline(line.slice(4)) + '</h3>'); continue; }
        if (line.startsWith('## ')) { closeList(); out.push('<h2>' + inline(line.slice(3)) + '</h2>'); continue; }
        if (line.startsWith('# ')) { closeList(); out.push('<h1>' + inline(line.slice(2)) + '</h1>'); continue; }
        if (line.startsWith('> ')) { closeList(); out.push('<blockquote>' + inline(line.slice(2)) + '</blockquote>'); continue; }
        if (/^[-*]\\s+/.test(line)) {
          if (!listOpen) out.push('<ul>');
          listOpen = true;
          out.push('<li>' + inline(line.replace(/^[-*]\\s+/, '')) + '</li>');
          continue;
        }
        closeList();
        out.push('<p>' + inline(line) + '</p>');
      }
      flushTable();
      closeList();
      if (inCode) out.push('</code></pre>');
      return '<div class="md">' + out.join('\\n') + '</div>';
    }

    function currentProject() {
      return PROJECTS.find(project => project.slug === selectedProject) || PROJECTS[0];
    }

    function matches(project, query) {
      if (!query) return true;
      const haystack = [
        project.title,
        project.summary,
        ...Object.values(project.sections).map(section => section.content)
      ].join('\\n').toLowerCase();
      return haystack.includes(query.toLowerCase());
    }

    function renderList() {
      const query = el.search.value.trim();
      const visible = PROJECTS.filter(project => matches(project, query));
      el.list.innerHTML = visible.map(project => \`
        <button class="project-btn \${project.slug === selectedProject ? 'active' : ''}" data-project="\${escapeHtml(project.slug)}">
          <span class="project-name">\${escapeHtml(project.title)}</span>
          <span class="project-summary">\${escapeHtml(project.summary)}</span>
        </button>
      \`).join('') || '<div class="empty">No matches.</div>';
    }

    function renderProject() {
      const project = currentProject();
      if (!project) return;
      if (!project.sections[selectedSection]) selectedSection = Object.keys(project.sections)[0] || '00-overview';
      el.title.textContent = project.title;
      el.summary.textContent = project.summary;
      el.tabs.innerHTML = Object.entries(project.sections).map(([key, section]) => \`
        <button class="tab \${key === selectedSection ? 'active' : ''}" data-section="\${escapeHtml(key)}">\${escapeHtml(section.label)}</button>
      \`).join('');
      const section = project.sections[selectedSection];
      el.content.className = 'content';
      el.content.innerHTML = section ? renderMarkdown(section.content) : '<div class="empty">No content for this section yet.</div>';
      renderList();
    }

    el.list.addEventListener('click', event => {
      const button = event.target.closest('[data-project]');
      if (!button) return;
      selectedProject = button.dataset.project;
      selectedSection = '00-overview';
      renderProject();
    });

    el.tabs.addEventListener('click', event => {
      const button = event.target.closest('[data-section]');
      if (!button) return;
      selectedSection = button.dataset.section;
      renderProject();
    });

    el.search.addEventListener('input', renderList);

    el.copyImport.addEventListener('click', async () => {
      await navigator.clipboard.writeText('npm run import -- https://github.com/owner/repo');
      el.copyImport.textContent = 'Copied';
      setTimeout(() => el.copyImport.textContent = 'Copy import command', 1200);
    });

    el.copyUpload.addEventListener('click', async () => {
      const project = currentProject();
      const text = project
        ? \`Upload these markdown files for \${project.slug}:\\nbrain/projects/\${project.slug}/00-overview.md\\nbrain/projects/\${project.slug}/01-architecture.md\\nbrain/projects/\${project.slug}/02-packages.md\\nbrain/projects/\${project.slug}/03-implementations.md\\nbrain/projects/\${project.slug}/04-gotchas.md\`
        : 'Upload 00-overview.md through 04-gotchas.md from each brain/projects/* folder.';
      await navigator.clipboard.writeText(text);
      el.copyUpload.textContent = 'Copied';
      setTimeout(() => el.copyUpload.textContent = 'Copy Claude upload checklist', 1200);
    });

    renderProject();
  </script>
</body>
</html>`;
}

const projects = loadProjects();
rebuildMarkdownIndex(projects);
const outPath = path.join(brainDir, 'index.html');
fs.writeFileSync(outPath, html(projects));
console.log(`Dashboard generated -> ${outPath}`);
console.log(`Projects: ${projects.length}`);

````

### scripts\load-env.js

````javascript
const fs = require('fs');
const path = require('path');

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

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

module.exports = { loadEnv };

````

### scripts\new-idea.js

````javascript
#!/usr/bin/env node
/**
 * new-idea.js
 * Generate a structured idea document for the brain (the "grows over time" part).
 * Pulls the brain index for context so ideas connect to what you already built.
 *
 * Setup (Node 18+):  export GROQ_API_KEY=...
 *
 * Usage:
 *   node new-idea.js "AI resume tailor"
 *   node new-idea.js "AI resume tailor" --desc "tailors my resume per job description"
 *   node new-idea.js "X" --out ./brain --model openai/gpt-oss-120b
 */

const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./load-env');

loadEnv();

// ---------- args ----------
const USAGE = `Usage: node scripts/new-idea.js "<idea title>" [--desc "..."] [--out ./brain] [--model name]

Options:
  --desc text    Short description to guide the idea plan.
  --out dir      Brain folder. Default: ./brain.
  --model name   Groq model to use. Default: llama-3.3-70b-versatile.
  -h, --help     Show this help.`;

const args = process.argv.slice(2);
let title = null;
let desc = '';
let brainDir = path.resolve('./brain');
let model = 'llama-3.3-70b-versatile';

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
  if (a === '--desc') desc = readOptionValue(a, i++);
  else if (a === '--out') brainDir = path.resolve(readOptionValue(a, i++));
  else if (a === '--model') model = readOptionValue(a, i++);
  else if (a.startsWith('--')) {
    console.error(`Unknown option: ${a}\n\n${USAGE}`);
    process.exit(1);
  }
  else if (!a.startsWith('--') && !title) title = a;
  else {
    console.error(`Unexpected argument: ${a}\n\n${USAGE}`);
    process.exit(1);
  }
}

if (!title) {
  console.error(USAGE);
  process.exit(1);
}
if (!process.env.GROQ_API_KEY) {
  console.error('Missing GROQ_API_KEY environment variable.');
  process.exit(1);
}

// ---------- context from existing brain ----------
let indexContext = '';
const readme = path.join(brainDir, 'README.md');
if (fs.existsSync(readme)) indexContext = fs.readFileSync(readme, 'utf8').slice(0, 4000);

const date = new Date().toISOString().slice(0, 10);
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const prompt = `You are a pragmatic senior engineer helping plan a new project idea.

Existing projects in this developer's brain (for reuse and context):
${indexContext || '(none yet)'}

New idea title: ${title}
${desc ? `Short description: ${desc}` : ''}

Write ONE concise, scannable markdown plan. Short bullets, short lines, grouped. No long paragraphs.
Where useful, point to which existing project's patterns could be reused.
Use these sections exactly:

# ${title}

## Problem / why
## Core idea
## Suggested stack
## Build phases
## Reuse from existing projects
## Risks / open questions
## First concrete step`;

async function main() {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error(`Groq error ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  const text = (data.choices?.[0]?.message?.content || '').trim();

  const ideasDir = path.join(brainDir, 'ideas');
  fs.mkdirSync(ideasDir, { recursive: true });
  const outPath = path.join(ideasDir, `${date}-${slug}.md`);
  fs.writeFileSync(outPath, text + '\n');
  console.log(`Idea saved -> ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

````

### server\index.js

````javascript
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const cors = require('cors');
const express = require('express');

const { loadEnv } = require('../scripts/load-env');

loadEnv();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const ROOT = path.resolve(__dirname, '..');
const BRAIN_DIR = path.join(ROOT, 'brain');
const PROJECTS_DIR = path.join(BRAIN_DIR, 'projects');
const STAGING_DIR = path.join(BRAIN_DIR, '_staging');
const RUNS_DIR = path.join(BRAIN_DIR, '_runs');

const jobs = new Map();

fs.mkdirSync(PROJECTS_DIR, { recursive: true });
fs.mkdirSync(STAGING_DIR, { recursive: true });
fs.mkdirSync(RUNS_DIR, { recursive: true });

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

function isGitHubUrl(value) {
  return /^https:\/\/github\.com\/[^/\s]+\/[^/\s#?]+(?:\.git)?(?:[?#].*)?$/i.test(String(value || '').trim());
}

function slugFromSource(value) {
  const cleaned = String(value)
    .replace(/\.git$/i, '')
    .replace(/[?#].*$/, '')
    .replace(/^https?:\/\/github\.com\//i, '');
  const parts = cleaned.split(/[\\/]/).filter(Boolean);
  return (parts[parts.length - 1] || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'project';
}

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function titleFrom(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].replace(/\s+-\s+(Overview|Architecture|Packages|Key Implementations|Decisions & Gotchas)$/i, '').trim() : fallback;
}

function summaryFrom(markdown) {
  const line = markdown.split(/\r?\n/).map(item => item.trim()).find(item => item.startsWith('- '));
  return line ? line.replace(/^-\s*/, '').slice(0, 180) : 'No summary yet.';
}

function readProject(slug) {
  const projectDir = path.join(PROJECTS_DIR, slug);
  if (!fs.existsSync(projectDir) || !fs.statSync(projectDir).isDirectory()) return null;

  const files = [
    ['00-overview', 'Overview', '00-overview.md'],
    ['01-architecture', 'Architecture', '01-architecture.md'],
    ['02-packages', 'Packages', '02-packages.md'],
    ['03-implementations', 'Implementations', '03-implementations.md'],
    ['04-gotchas', 'Gotchas', '04-gotchas.md'],
    ['raw.context', 'Raw Context', 'raw.context.md'],
  ];

  const sections = files
    .map(([key, label, filename]) => ({ key, label, filename, content: readIfExists(path.join(projectDir, filename)) }))
    .filter(section => section.content);

  const overview = sections.find(section => section.key === '00-overview')?.content || '';
  return {
    slug,
    title: titleFrom(overview, slug),
    summary: summaryFrom(overview),
    sections,
  };
}

function listProjects() {
  return fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => readProject(entry.name))
    .filter(Boolean)
    .sort((a, b) => a.title.localeCompare(b.title));
}

function runCommand(job, command, args, options = {}) {
  return new Promise((resolve, reject) => {
    job.logs.push(`$ ${command} ${args.join(' ')}`);
    const child = spawn(command, args, {
      cwd: ROOT,
      shell: false,
      env: process.env,
      ...options,
    });

    child.stdout.on('data', data => {
      for (const line of String(data).split(/\r?\n/).filter(Boolean)) job.logs.push(line);
    });

    child.stderr.on('data', data => {
      for (const line of String(data).split(/\r?\n/).filter(Boolean)) job.logs.push(line);
    });

    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function createJob(repoUrl, options) {
  const id = crypto.randomUUID();
  const slug = slugFromSource(repoUrl);
  const job = {
    id,
    slug,
    repoUrl,
    status: 'queued',
    step: 'Queued',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    logs: [],
    project: null,
    error: null,
  };
  jobs.set(id, job);
  runImport(job, options).catch(err => {
    job.status = 'failed';
    job.step = 'Failed';
    job.error = err.message;
    job.logs.push(`ERROR: ${err.message}`);
    job.updatedAt = new Date().toISOString();
  });
  return job;
}

async function runImport(job, options) {
  const runDir = path.join(RUNS_DIR, job.id);
  const cloneDir = path.join(runDir, job.slug);
  const contextPath = path.join(STAGING_DIR, `${job.slug}.context.md`);
  const maxKb = String(options.maxKb || 120);
  const maxChars = String(options.maxChars || 30000);
  const model = options.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const cleanup = options.cleanup !== false;

  job.status = 'running';
  job.step = 'Preparing workspace';
  job.updatedAt = new Date().toISOString();
  fs.mkdirSync(runDir, { recursive: true });

  try {
    job.step = 'Cloning repository';
    await runCommand(job, 'git', ['clone', '--depth', '1', job.repoUrl, cloneDir]);

    job.step = 'Bundling code context';
    await runCommand(job, 'node', [
      path.join(ROOT, 'scripts', 'brain-bundle.js'),
      cloneDir,
      '--out',
      contextPath,
      '--maxkb',
      maxKb,
      '--source-url',
      job.repoUrl,
    ]);

    job.step = 'Generating markdown brain files';
    await runCommand(job, 'node', [
      path.join(ROOT, 'scripts', 'brain-refine.js'),
      contextPath,
      '--out',
      BRAIN_DIR,
      '--model',
      model,
      '--maxchars',
      maxChars,
    ]);

    job.step = 'Refreshing dashboard';
    await runCommand(job, 'node', [path.join(ROOT, 'scripts', 'brain-ui.js'), '--out', BRAIN_DIR]);

    job.status = 'complete';
    job.step = cleanup ? 'Complete - clone deleted' : 'Complete - clone kept';
    job.project = readProject(job.slug);
  } finally {
    if (cleanup && fs.existsSync(runDir)) {
      fs.rmSync(runDir, { recursive: true, force: true });
      job.logs.push(`Deleted temporary clone: ${runDir}`);
    }
    job.updatedAt = new Date().toISOString();
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, groqConfigured: Boolean(process.env.GROQ_API_KEY) });
});

app.get('/api/projects', (req, res) => {
  res.json({ projects: listProjects() });
});

app.get('/api/projects/:slug', (req, res) => {
  const project = readProject(req.params.slug);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json({ project });
});

app.post('/api/import', (req, res) => {
  const repoUrl = String(req.body.repoUrl || '').trim();
  if (!isGitHubUrl(repoUrl)) return res.status(400).json({ error: 'Paste a valid https://github.com/owner/repo URL.' });
  if (!process.env.GROQ_API_KEY) return res.status(400).json({ error: 'GROQ_API_KEY is missing in local .env.' });

  const job = createJob(repoUrl, {
    cleanup: req.body.cleanup !== false,
    maxKb: Number(req.body.maxKb || 120),
    maxChars: Number(req.body.maxChars || 30000),
    model: req.body.model,
  });
  res.status(202).json({ job });
});

app.get('/api/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ job });
});

const distDir = path.join(ROOT, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Code Brain API: http://127.0.0.1:${PORT}`);
});

````

### SETUP.md

````markdown
# Code Brain - React + Express App

Code Brain turns GitHub repositories into a local markdown knowledge base.

Paste a GitHub URL, let the backend clone and scan it, generate project markdown with Groq, then browse the result in the React brain dashboard.

## Current Product Workflow

1. Open the React app.
2. Paste a GitHub repo URL.
3. The Express backend creates an autonomous import job.
4. The job clones the repo into `brain/_runs/<job>/`.
5. The existing bundler scans source files and skips secrets, binaries, build folders, and huge files.
6. Groq refines the raw context into markdown:
   - `00-overview.md`
   - `01-architecture.md`
   - `02-packages.md`
   - `03-implementations.md`
   - `04-gotchas.md`
   - `raw.context.md`
7. The dashboard refreshes.
8. The temporary cloned repo is deleted automatically by default.

## Run Locally

Create local `.env`:

```powershell
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Install dependencies:

```bash
npm install
```

Run app:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

API runs at:

```text
http://127.0.0.1:4000
```

## Important Folders

- `client/` - React/Vite frontend.
- `server/` - Express backend and import job API.
- `scripts/brain-bundle.js` - repo scanner/context bundler.
- `scripts/brain-refine.js` - Groq markdown generator.
- `brain/projects/` - generated project knowledge.
- `brain/_runs/` - temporary clones, ignored and deleted after import.
- `brain/_staging/` - generated raw context staging, ignored.

## API

- `GET /api/health`
- `GET /api/projects`
- `GET /api/projects/:slug`
- `POST /api/import`
- `GET /api/jobs/:id`

`POST /api/import` body:

```json
{
  "repoUrl": "https://github.com/owner/repo",
  "cleanup": true,
  "maxChars": 30000,
  "maxKb": 120
}
```

## Optional Supabase Later

Right now the app uses local markdown as the source of truth.

Supabase can be added later for:

- saved import history
- project metadata
- job history
- embeddings/vector search
- multi-device sync

Use `.env.example` placeholders only in git. Keep real Supabase keys local and rotate any key that was pasted into chat.

## Build

```bash
npm run build
npm start
```

In production mode, Express serves the built React app from `dist/`.

````

### vite.config.js

````javascript
const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig({
  root: 'client',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:4000',
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});

````

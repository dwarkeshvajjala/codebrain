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

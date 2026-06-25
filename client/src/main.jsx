import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const SECTION_ORDER = [
  '00-overview',
  '01-architecture',
  '02-packages',
  '03-implementations',
  '04-gotchas',
  '05-configuration',
  'raw.context',
];

const SECTION_LABELS = {
  '00-overview': 'Overview',
  '01-architecture': 'Architecture',
  '02-packages': 'Packages',
  '03-implementations': 'Implementations',
  '04-gotchas': 'Gotchas',
  '05-configuration': 'Configuration',
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

function safeHref(value) {
  const href = String(value || '').trim();
  if (/^(https?:|mailto:)/i.test(href)) return escapeHtml(href);
  if (!/^[a-z][a-z0-9+.-]*:/i.test(href) && !/[\s"'<>]/.test(href)) return escapeHtml(href);
  return '#';
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => `<a href="${safeHref(href)}" target="_blank" rel="noreferrer">${label}</a>`);
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

function projectMode(project) {
  const keys = new Set((project?.sections || []).map(section => section.key));
  return keys.has('01-architecture') ? 'AI notes' : 'Raw bundle';
}

function hasAiNotes(project) {
  return new Set((project?.sections || []).map(section => section.key)).has('01-architecture');
}

function repoInputItems(value) {
  return String(value || '').split(/[\s,]+/).map(item => item.trim()).filter(Boolean);
}

function projectStats(project) {
  const meta = project?.meta || {};
  return [
    ['Files', meta.filesIncluded || 0],
    ['Summarized', meta.filesSummarized || 0],
    ['Skipped', meta.filesSkipped || 0],
    ['Styles ignored', meta.styleFilesIgnored || 0],
    ['Assets ignored', meta.mediaAssetsIgnored || 0],
    ['Sections', project?.sections?.length || 0],
  ];
}

function projectSourceUrl(project) {
  const url = project?.meta?.gitUrl || '';
  return /^https?:\/\//i.test(url) ? url : '';
}

function storageLabel(storage) {
  if (!storage) return 'Storage checking';
  if (storage.readConfigured && storage.provider === 'local') return 'Remote brain';
  if (storage.readConfigured) return `${storage.provider} brain`;
  if (storage.writeConfigured) return `${storage.provider} ready`;
  return 'Local markdown';
}

function activeJobCount(jobs) {
  return jobs.filter(item => ['queued', 'running'].includes(item.status)).length;
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
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [deleteSlug, setDeleteSlug] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function loadProjects(nextSlug) {
    const data = await api('/api/projects');
    setProjects(data.projects);
    const targetSlug = nextSlug || selectedSlug;
    if (targetSlug && data.projects.some(project => project.slug === targetSlug)) setSelectedSlug(targetSlug);
    else setSelectedSlug(data.projects[0]?.slug || '');
  }

  useEffect(() => {
    api('/api/health').then(setHealth).catch(err => setError(err.message));
    loadProjects().catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    const activeJobs = jobs.filter(item => ['queued', 'running'].includes(item.status));
    if (!activeJobs.length) return undefined;
    const timer = setInterval(async () => {
      try {
        const updates = await Promise.all(activeJobs.map(item =>
          api(`/api/jobs/${item.id}`)
            .then(data => data.job)
            .catch(err => ({ ...item, status: 'failed', step: 'Failed', error: err.message }))
        ));
        setJobs(current => current.map(item => updates.find(update => update.id === item.id) || item));
        api('/api/health').then(setHealth).catch(() => undefined);
        const completed = updates.find(item => item.status === 'complete');
        if (completed) await loadProjects(completed.slug);
      } catch (err) {
        setError(err.message);
      }
    }, 1200);
    return () => clearInterval(timer);
  }, [jobs]);

  const selectedProject = projects.find(project => project.slug === selectedSlug) || projects[0];
  const sections = selectedProject?.sections || [];
  const section = sections.find(item => item.key === selectedSection) || sections[0];
  const selectedProjectAnalyzing = selectedProject
    ? jobs.some(item => item.slug === selectedProject.slug && item.type === 'analysis' && ['queued', 'running'].includes(item.status))
    : false;

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
    setNotice('');
    try {
      const urls = repoInputItems(repoUrl);
      const bulk = urls.length > 1;
      const data = await api(bulk ? '/api/import-bulk' : '/api/import', {
        method: 'POST',
        body: JSON.stringify(bulk
          ? { urls, cleanup, maxChars: 30000, maxKb: 120 }
          : { repoUrl: urls[0] || repoUrl, cleanup, maxChars: 30000, maxKb: 120 }),
      });
      const nextJobs = data.jobs || [data.job];
      setJobs(current => [...nextJobs, ...current].slice(0, 24));
      if (data.warnings?.length) setNotice(data.warnings.join('\n'));
      else setNotice(`${nextJobs.length} import${nextJobs.length === 1 ? '' : 's'} queued.`);
    } catch (err) {
      setError(err.message);
    }
  }

  function selectProject(slug) {
    setSelectedSlug(slug);
    setSelectedSection('00-overview');
    setDeleteSlug('');
  }

  async function syncStorage() {
    setError('');
    setNotice('');
    setSyncing(true);
    try {
      const data = await api('/api/storage/sync', { method: 'POST' });
      setProjects(data.projects);
      setHealth(current => ({ ...(current || {}), storage: data.storage }));
      if (data.result?.skipped) setNotice(data.result.reason);
      else setNotice(`Cloud sync complete. Manifest: ${data.result.manifestUrl}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  async function analyzeProject(slug) {
    if (!slug) return;
    setError('');
    setNotice('');
    try {
      const data = await api(`/api/projects/${slug}/analyze`, {
        method: 'POST',
        body: JSON.stringify({ maxChars: 30000 }),
      });
      setJobs(current => [data.job, ...current].slice(0, 24));
      setNotice(`AI analysis queued for ${slug}. New tabs will appear when it finishes.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteProject(slug) {
    if (!slug) return;
    setError('');
    setDeleting(true);
    try {
      const data = await api(`/api/projects/${slug}`, { method: 'DELETE' });
      setProjects(data.projects);
      setSelectedSlug(data.projects[0]?.slug || '');
      setSelectedSection('00-overview');
      setDeleteSlug('');
      if (data.warning) setNotice(data.warning);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <BrainMark />
          <div>
            <p className="eyebrow">Portable code memory</p>
            <h1>Code Brain</h1>
          </div>
        </div>

        <form className="import-card" onSubmit={submitImport}>
          <label htmlFor="repoUrl">GitHub repo URL</label>
          <div className="url-row">
            <textarea
              id="repoUrl"
              value={repoUrl}
              onChange={event => setRepoUrl(event.target.value)}
              placeholder={'https://github.com/owner/repo\nhttps://github.com/owner/another-repo'}
              rows={3}
            />
            <button type="submit" disabled={!repoUrl.trim() || activeJobCount(jobs) > 0}>
              Import{repoInputItems(repoUrl).length > 1 ? ` ${repoInputItems(repoUrl).length}` : ''}
            </button>
          </div>
          <label className="check-row">
            <input type="checkbox" checked={cleanup} onChange={event => setCleanup(event.target.checked)} />
            Delete cloned repo automatically after markdown is generated
          </label>
          <p className="hint">
            Import first clones and bundles a repo into raw markdown with deterministic configuration extraction. Run AI analysis later from the project page when you actually want Groq to spend tokens.
          </p>
        </form>

        <div className="status-strip">
          <span className={`status-pill ${health?.groqConfigured ? 'ready' : 'warn'}`}>
            <span className={health?.groqConfigured ? 'dot ok' : 'dot warn'} />
            {health?.groqConfigured ? 'Groq ready' : 'Raw mode'}
          </span>
          <span className="status-pill">{projects.length} project{projects.length === 1 ? '' : 's'}</span>
          <span className="status-pill">{health?.activeImports || 0} active</span>
          <span className={`status-pill ${health?.storage?.readConfigured ? 'ready' : 'warn'}`}>{storageLabel(health?.storage)}</span>
          <button className="mini-btn" type="button" onClick={syncStorage} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync cloud'}
          </button>
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
              <strong>
                {project.title}
                <span className="mode-chip">{projectMode(project)}</span>
              </strong>
              <span>{project.summary}</span>
              {!!project.meta?.filesIncluded && <small>{project.meta.filesIncluded} bundled files</small>}
            </button>
          ))}
          {!filteredProjects.length && <p className="empty-note">No projects match.</p>}
        </div>
      </aside>

      <section className="workspace">
        <header className="hero">
          <div>
            <p className="eyebrow">Autonomous markdown generation</p>
            <h2>Paste a repo. Build the raw brain.</h2>
            <p>
              Code Brain imports repos quickly first, extracts configuration and integrations without AI, then lets you run Groq analysis as a second step.
            </p>
          </div>
          <div className="metrics">
            <span>{projects.length}</span>
            <small>project{projects.length === 1 ? '' : 's'} indexed</small>
          </div>
        </header>

        {error && <div className="notice error">{error}</div>}
        {notice && <div className="notice info">{notice}</div>}

        {!!jobs.length && (
          <section className="job-panel">
            <div className="job-head">
              <div>
                <strong>Job queue</strong>
                <span>{activeJobCount(jobs)} active or queued</span>
              </div>
              <button className="mini-btn" type="button" onClick={() => setJobs(current => current.filter(item => ['queued', 'running'].includes(item.status)))}>
                Clear finished
              </button>
            </div>
            <div className="job-list">
              {jobs.map(item => (
                <article className={`job-card ${item.status}`} key={item.id}>
                  <div>
                    <strong>{item.slug}</strong>
                    <span>{item.type === 'analysis' ? 'AI analysis' : 'Import'} - {item.step}</span>
                    {item.error && <em>{item.error}</em>}
                  </div>
                  <b>{item.status}</b>
                  <details open={['running', 'failed'].includes(item.status)}>
                    <summary>Logs</summary>
                    <pre>{item.logs?.slice(-10).join('\n') || 'Waiting...'}</pre>
                  </details>
                </article>
              ))}
            </div>
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
                <div className="project-actions">
                  <span className="project-chip">{projectMode(selectedProject)}</span>
                  <span className="project-chip">{sections.length} file{sections.length === 1 ? '' : 's'}</span>
                  {projectSourceUrl(selectedProject) && (
                    <a className="source-link" href={projectSourceUrl(selectedProject)} target="_blank" rel="noreferrer">Source</a>
                  )}
                  {!hasAiNotes(selectedProject) && (
                    <button
                      type="button"
                      className="analyze-btn"
                      onClick={() => analyzeProject(selectedProject.slug)}
                      disabled={selectedProjectAnalyzing}
                    >
                      {selectedProjectAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                    </button>
                  )}
                  {deleteSlug === selectedProject.slug ? (
                    <div className="delete-confirm">
                      <span>Delete this project?</span>
                      <button type="button" className="ghost-btn" onClick={() => setDeleteSlug('')} disabled={deleting}>Cancel</button>
                      <button type="button" className="danger-btn" onClick={() => deleteProject(selectedProject.slug)} disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="delete-btn" onClick={() => setDeleteSlug(selectedProject.slug)}>
                      Delete project
                    </button>
                  )}
                </div>
              </div>

              <div className="meta-grid">
                {projectStats(selectedProject).map(([label, value]) => (
                  <div className="meta-card" key={label}>
                    <span>{value}</span>
                    <small>{label}</small>
                  </div>
                ))}
              </div>

              {!!selectedProject.meta?.fileTypes?.length && (
                <div className="type-strip">
                  {selectedProject.meta.fileTypes.slice(0, 8).map(item => (
                    <span key={item.type}>{item.type} <b>{item.count}</b></span>
                  ))}
                </div>
              )}

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

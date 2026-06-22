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

function projectMode(project) {
  const keys = new Set((project?.sections || []).map(section => section.key));
  return keys.has('01-architecture') ? 'AI notes' : 'Raw bundle';
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
  const [deleteSlug, setDeleteSlug] = useState('');
  const [deleting, setDeleting] = useState(false);

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
    setDeleteSlug('');
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
            The backend clones, bundles, writes markdown, refreshes the brain, then removes the temp clone. If Groq is configured it also generates architecture, package, implementation, and gotcha notes.
          </p>
        </form>

        <div className="status-strip">
          <span className={`status-pill ${health?.groqConfigured ? 'ready' : 'warn'}`}>
            <span className={health?.groqConfigured ? 'dot ok' : 'dot warn'} />
            {health?.groqConfigured ? 'Groq ready' : 'Raw mode'}
          </span>
          <span className="status-pill">{projects.length} project{projects.length === 1 ? '' : 's'}</span>
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
              Code Brain turns repos into raw context first, then adds overview, architecture, package, implementation, and gotcha notes when Groq is available.
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
                <div className="project-actions">
                  <span className="project-chip">{projectMode(selectedProject)}</span>
                  <span className="project-chip">{sections.length} file{sections.length === 1 ? '' : 's'}</span>
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

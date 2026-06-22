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

function isSafeSlug(value) {
  return /^[a-z0-9][a-z0-9-]*$/.test(String(value || ''));
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

function parseContextMeta(context) {
  const meta = {};
  for (const line of String(context || '').split(/\r?\n/).slice(0, 24)) {
    const match = line.match(/^-\s*([^:]+):\s*(.*)$/);
    if (match) meta[match[1].trim().toLowerCase()] = match[2].trim();
  }
  const header = String(context || '').match(/^#\s*Project Context:\s*(.+)$/m);
  if (header) meta.project = header[1].trim();
  return meta;
}

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function projectPathFor(slug) {
  if (!isSafeSlug(slug)) return null;
  const projectDir = path.resolve(PROJECTS_DIR, slug);
  const projectsRoot = path.resolve(PROJECTS_DIR) + path.sep;
  return projectDir.startsWith(projectsRoot) ? projectDir : null;
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
  if (!isSafeSlug(slug)) return null;
  const projectDir = projectPathFor(slug);
  if (!projectDir) return null;
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

function writeBundleOnlyProject(slug, contextPath, sourceUrl) {
  const context = fs.readFileSync(contextPath, 'utf8');
  const meta = parseContextMeta(context);
  const projectDir = path.join(PROJECTS_DIR, slug);
  fs.mkdirSync(projectDir, { recursive: true });
  fs.copyFileSync(contextPath, path.join(projectDir, 'raw.context.md'));

  const overviewPath = path.join(projectDir, '00-overview.md');
  const existingOverview = readIfExists(overviewPath);
  if (existingOverview && !existingOverview.includes('Bundle-only import')) return;

  const projectName = meta.project || slug;
  fs.writeFileSync(overviewPath, `# ${projectName} - Overview

- Bundle-only import created because Groq refine is not configured.
- Source path: ${meta['source path'] || 'TODO'}
- Git URL: ${sourceUrl || meta['git url'] || 'TODO'}
- Files included: ${meta['files included'] || 'TODO'}
- Files skipped: ${meta['files skipped (> 120 kb)'] || meta['files skipped (> 250 kb)'] || 'TODO'}

## Next Step

- Set \`GROQ_API_KEY\` in local \`.env\`, restart the server, and import again to generate architecture, packages, implementations, and gotchas.
- Until then, open \`raw.context.md\` for the bundled source context.
`);
}

function runUtility(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      shell: false,
      env: process.env,
    });
    let output = '';

    child.stdout.on('data', data => {
      output += String(data);
    });
    child.stderr.on('data', data => {
      output += String(data);
    });
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve(output);
      else reject(new Error(output.trim() || `${command} exited with code ${code}`));
    });
  });
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

    if (process.env.GROQ_API_KEY) {
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
    } else {
      job.step = 'Creating raw bundle project';
      job.logs.push('GROQ_API_KEY is missing. Skipping AI refine and saving raw context only.');
      writeBundleOnlyProject(job.slug, contextPath, job.repoUrl);
    }

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
  if (!isSafeSlug(req.params.slug)) return res.status(400).json({ error: 'Invalid project slug' });
  const project = readProject(req.params.slug);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json({ project });
});

app.post('/api/import', (req, res) => {
  const repoUrl = String(req.body.repoUrl || '').trim();
  if (!isGitHubUrl(repoUrl)) return res.status(400).json({ error: 'Paste a valid https://github.com/owner/repo URL.' });

  const job = createJob(repoUrl, {
    cleanup: req.body.cleanup !== false,
    maxKb: Number(req.body.maxKb || 120),
    maxChars: Number(req.body.maxChars || 30000),
    model: req.body.model,
  });
  res.status(202).json({ job });
});

app.delete('/api/projects/:slug', async (req, res) => {
  const slug = req.params.slug;
  const projectDir = projectPathFor(slug);
  if (!projectDir) return res.status(400).json({ error: 'Invalid project slug' });
  if (!fs.existsSync(projectDir) || !fs.statSync(projectDir).isDirectory()) {
    return res.status(404).json({ error: 'Project not found' });
  }

  fs.rmSync(projectDir, { recursive: true, force: true });
  try {
    await runUtility('node', [path.join(ROOT, 'scripts', 'brain-ui.js'), '--out', BRAIN_DIR]);
  } catch (err) {
    return res.status(500).json({ error: `Project deleted, but dashboard refresh failed: ${err.message}` });
  }

  res.json({ deleted: slug, projects: listProjects() });
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

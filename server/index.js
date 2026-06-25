const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const cors = require('cors');
const express = require('express');

const { loadEnv } = require('../scripts/load-env');
const {
  publicStorageState,
  readRemoteProjects,
  syncProjectsToRemote,
} = require('./remote-storage');

loadEnv();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const ROOT = path.resolve(__dirname, '..');
const BRAIN_DIR = path.join(ROOT, 'brain');
const PROJECTS_DIR = path.join(BRAIN_DIR, 'projects');
const STAGING_DIR = path.join(BRAIN_DIR, '_staging');
const RUNS_DIR = path.join(BRAIN_DIR, '_runs');
const MAX_IMPORT_CONCURRENCY = Math.max(1, Math.min(3, Number(process.env.CODE_BRAIN_IMPORT_CONCURRENCY || 1)));
const MAX_BULK_IMPORTS = 20;

const jobs = new Map();
const importQueue = [];
let activeImports = 0;

fs.mkdirSync(PROJECTS_DIR, { recursive: true });
fs.mkdirSync(STAGING_DIR, { recursive: true });
fs.mkdirSync(RUNS_DIR, { recursive: true });

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

function normalizeGitHubUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const ssh = raw.match(/^git@github\.com:([A-Za-z0-9-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?(?:[?#].*)?$/i);
  if (ssh) return `https://github.com/${ssh[1]}/${ssh[2].replace(/\.git$/i, '')}`;

  const normalized = raw.startsWith('github.com/') ? `https://${raw}` : raw;
  const match = normalized.match(/^https:\/\/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9_.-]+)(?:\.git)?(?:[/?#].*)?$/i);
  if (!match) return '';

  return `https://github.com/${match[1]}/${match[2].replace(/\.git$/i, '')}`;
}

function parseRepoInputs(value) {
  const items = Array.isArray(value)
    ? value
    : String(value || '').split(/[\s,]+/);
  return items.map(item => String(item || '').trim()).filter(Boolean);
}

function normalizeRepoList(value) {
  const seen = new Set();
  const urls = [];
  const warnings = [];

  for (const item of parseRepoInputs(value)) {
    const url = normalizeGitHubUrl(item);
    if (!url) {
      warnings.push(`Skipped invalid GitHub URL: ${item}`);
      continue;
    }
    if (seen.has(url)) {
      warnings.push(`Skipped duplicate repository: ${url}`);
      continue;
    }
    seen.add(url);
    urls.push(url);
  }

  if (urls.length > MAX_BULK_IMPORTS) {
    warnings.push(`Only the first ${MAX_BULK_IMPORTS} valid repositories were queued.`);
    urls.length = MAX_BULK_IMPORTS;
  }

  return { urls, warnings };
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

function parseContextList(context, heading) {
  const pattern = new RegExp(`^## ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm');
  const match = String(context || '').match(pattern);
  if (!match) return [];

  const start = match.index + match[0].length;
  const rest = String(context || '').slice(start);
  const end = rest.search(/^##\s+/m);
  const section = end === -1 ? rest : rest.slice(0, end);
  return section
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('- '))
    .map(line => line.replace(/^-\s*/, ''));
}

function contextSection(context, heading) {
  const pattern = new RegExp(`^## ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm');
  const text = String(context || '');
  const match = text.match(pattern);
  if (!match) return '';
  const start = match.index + match[0].length;
  const rest = text.slice(start);
  const end = rest.search(/^##\s+/m);
  return (end === -1 ? rest : rest.slice(0, end)).trim();
}

function numberFromMeta(value) {
  const parsed = Number(String(value || '').replace(/[^\d]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseRawContextInfo(context) {
  const meta = parseContextMeta(context);
  const fileTypes = parseContextList(context, 'File type breakdown')
    .map(item => {
      const match = item.match(/^(.+):\s*(\d+)$/);
      return match ? { type: match[1], count: Number(match[2]) } : null;
    })
    .filter(Boolean);

  return {
    generated: meta.generated || '',
    sourcePath: meta['source path'] || '',
    gitUrl: meta['git url'] || '',
    filesIncluded: numberFromMeta(meta['files included']),
    filesSummarized: numberFromMeta(meta['files summarized (large data/notebooks)']),
    filesSkipped: numberFromMeta(meta['files skipped (> 120 kb)'] || meta['files skipped (> 250 kb)']),
    styleFilesIgnored: numberFromMeta(meta['style files ignored']),
    mediaAssetsIgnored: numberFromMeta(meta['media/design assets ignored']),
    fileTypes,
    skippedLargeFiles: parseContextList(context, 'Skipped large files'),
    summarizedFiles: parseContextList(context, 'Summarized data/notebook files'),
  };
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
  return match ? match[1].replace(/\s+-\s+(Overview|Architecture|Packages|Key Implementations|Decisions & Gotchas|Configuration)$/i, '').trim() : fallback;
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
    ['05-configuration', 'Configuration', '05-configuration.md'],
    ['raw.context', 'Raw Context', 'raw.context.md'],
  ];

  const sections = files
    .map(([key, label, filename]) => ({ key, label, filename, content: readIfExists(path.join(projectDir, filename)) }))
    .filter(section => section.content);

  const overview = sections.find(section => section.key === '00-overview')?.content || '';
  const rawContext = sections.find(section => section.key === 'raw.context')?.content || '';
  return {
    slug,
    title: titleFrom(overview, slug),
    summary: summaryFrom(overview),
    meta: parseRawContextInfo(rawContext),
    sections,
  };
}

function writeBundleOnlyProject(slug, contextPath, sourceUrl, reason = 'Groq refine is not configured') {
  const context = fs.readFileSync(contextPath, 'utf8');
  const meta = parseContextMeta(context);
  const projectDir = path.join(PROJECTS_DIR, slug);
  fs.mkdirSync(projectDir, { recursive: true });
  fs.copyFileSync(contextPath, path.join(projectDir, 'raw.context.md'));

  const projectName = meta.project || slug;
  const overviewPath = path.join(projectDir, '00-overview.md');
  const existingOverview = readIfExists(overviewPath);
  const configSummary = contextSection(context, 'Configuration & integrations');
  fs.writeFileSync(path.join(projectDir, '05-configuration.md'), `# ${projectName} - Configuration

${configSummary || '_No configuration or integration key references detected in the raw context._'}

## Safety

- Values are redacted.
- Real secret values and full local secret files are not copied into this generated summary.
`);

  if (existingOverview && !existingOverview.includes('Bundle-only import')) return;

  fs.writeFileSync(overviewPath, `# ${projectName} - Overview

- Bundle-only import created because ${reason}.
- Source path: ${meta['source path'] || 'TODO'}
- Git URL: ${sourceUrl || meta['git url'] || 'TODO'}
- Files included: ${meta['files included'] || 'TODO'}
- Files skipped: ${meta['files skipped (> 120 kb)'] || meta['files skipped (> 250 kb)'] || 'TODO'}

## Next Step

- Set or restore \`GROQ_API_KEY\` in local \`.env\`, restart the server, and import again to generate architecture, packages, implementations, and gotchas.
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

function listLocalProjects() {
  return fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => readProject(entry.name))
    .filter(Boolean)
    .sort((a, b) => a.title.localeCompare(b.title));
}

async function listProjects() {
  try {
    const remoteProjects = await readRemoteProjects();
    if (remoteProjects) return remoteProjects;
  } catch (err) {
    console.warn(`Remote brain read failed; using local markdown: ${err.message}`);
  }
  return listLocalProjects();
}

async function syncRemoteBrain(job) {
  const result = await syncProjectsToRemote(listLocalProjects());
  if (result.skipped) {
    if (job) job.logs.push(`Remote storage skipped: ${result.reason}`);
    return result;
  }
  if (job) job.logs.push(`Remote storage synced: ${result.manifestUrl}`);
  return result;
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

function baseJob(slug, details = {}) {
  return {
    id: crypto.randomUUID(),
    slug,
    status: 'queued',
    step: 'Queued',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    logs: [],
    project: null,
    error: null,
    ...details,
  };
}

function enqueueJob(job, run) {
  jobs.set(job.id, job);
  importQueue.push({ job, run });
  processImportQueue();
  return job;
}

function createJob(repoUrl, options) {
  const normalizedUrl = normalizeGitHubUrl(repoUrl);
  const slug = slugFromSource(normalizedUrl);
  const job = baseJob(slug, {
    repoUrl: normalizedUrl,
    type: 'import',
  });
  return enqueueJob(job, () => runImport(job, options));
}

function createAnalysisJob(slug, options = {}) {
  const projectDir = projectPathFor(slug);
  if (!projectDir) return null;
  const contextPath = path.join(projectDir, 'raw.context.md');
  if (!fs.existsSync(contextPath)) return null;
  const job = baseJob(slug, {
    type: 'analysis',
    step: 'Queued AI analysis',
  });
  return enqueueJob(job, () => runAnalysis(job, options));
}

function processImportQueue() {
  while (activeImports < MAX_IMPORT_CONCURRENCY && importQueue.length) {
    const task = importQueue.shift();
    activeImports++;
    task.run()
      .catch(err => {
        task.job.status = 'failed';
        task.job.step = 'Failed';
        task.job.error = err.message;
        task.job.logs.push(`ERROR: ${err.message}`);
        task.job.updatedAt = new Date().toISOString();
      })
      .finally(() => {
        activeImports--;
        processImportQueue();
      });
  }
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

    if (options.analyze && process.env.GROQ_API_KEY) {
      job.step = 'Generating markdown brain files';
      try {
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
      } catch (err) {
        job.step = 'Saving raw bundle after AI refine failure';
        job.logs.push(`AI refine failed; saving raw bundle fallback: ${err.message}`);
        writeBundleOnlyProject(job.slug, contextPath, job.repoUrl, 'AI refine failed or was rate-limited');
      }
    } else {
      job.step = 'Creating raw bundle project';
      if (options.analyze) job.logs.push('GROQ_API_KEY is missing. Skipping AI refine and saving raw context only.');
      else job.logs.push('AI analysis was not requested. Saving raw context and deterministic configuration only.');
      writeBundleOnlyProject(job.slug, contextPath, job.repoUrl, options.analyze ? 'Groq refine is not configured' : 'AI analysis has not been run yet');
    }

    job.step = 'Refreshing dashboard';
    await runCommand(job, 'node', [path.join(ROOT, 'scripts', 'brain-ui.js'), '--out', BRAIN_DIR]);

    job.step = 'Syncing remote storage';
    try {
      await syncRemoteBrain(job);
    } catch (err) {
      job.logs.push(`Remote storage sync failed: ${err.message}`);
    }

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

async function runAnalysis(job, options) {
  const projectDir = projectPathFor(job.slug);
  if (!projectDir) throw new Error('Project not found');
  const contextPath = path.join(projectDir, 'raw.context.md');
  if (!fs.existsSync(contextPath)) throw new Error('Raw context is missing. Re-import the project first.');
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is missing. Add it to .env and restart the server.');

  const maxChars = String(options.maxChars || 30000);
  const model = options.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  job.status = 'running';
  job.step = 'Generating AI analysis';
  job.updatedAt = new Date().toISOString();

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

  job.step = 'Syncing remote storage';
  try {
    await syncRemoteBrain(job);
  } catch (err) {
    job.logs.push(`Remote storage sync failed: ${err.message}`);
  }

  job.status = 'complete';
  job.step = 'AI analysis complete';
  job.project = readProject(job.slug);
  job.updatedAt = new Date().toISOString();
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    groqConfigured: Boolean(process.env.GROQ_API_KEY),
    activeImports,
    queuedImports: importQueue.length,
    maxImportConcurrency: MAX_IMPORT_CONCURRENCY,
    storage: publicStorageState(),
  });
});

app.get('/api/projects', async (req, res) => {
  try {
    res.json({ projects: await listProjects() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:slug', async (req, res) => {
  if (!isSafeSlug(req.params.slug)) return res.status(400).json({ error: 'Invalid project slug' });
  try {
    const project = (await listProjects()).find(item => item.slug === req.params.slug);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/storage/sync', async (req, res) => {
  try {
    const result = await syncRemoteBrain();
    res.json({ result, storage: publicStorageState(), projects: await listProjects() });
  } catch (err) {
    res.status(500).json({ error: err.message, storage: publicStorageState() });
  }
});

app.post('/api/import', (req, res) => {
  const repoUrl = normalizeGitHubUrl(req.body.repoUrl);
  if (!repoUrl) return res.status(400).json({ error: 'Paste a valid GitHub repo URL like https://github.com/owner/repo.' });

  const job = createJob(repoUrl, {
    cleanup: req.body.cleanup !== false,
    maxKb: Number(req.body.maxKb || 120),
    maxChars: Number(req.body.maxChars || 30000),
    model: req.body.model,
    analyze: req.body.analyze === true,
  });
  res.status(202).json({ job });
});

app.post('/api/import-bulk', (req, res) => {
  const { urls, warnings } = normalizeRepoList(req.body.urls || req.body.repoUrls || req.body.text);
  if (!urls.length) {
    return res.status(400).json({ error: 'No valid GitHub repository URLs found.', warnings });
  }

  const options = {
    cleanup: req.body.cleanup !== false,
    maxKb: Number(req.body.maxKb || 120),
    maxChars: Number(req.body.maxChars || 30000),
    model: req.body.model,
    analyze: req.body.analyze === true,
  };
  const queuedJobs = urls.map(url => createJob(url, options));
  res.status(202).json({ jobs: queuedJobs, warnings });
});

app.post('/api/projects/:slug/analyze', (req, res) => {
  const slug = req.params.slug;
  if (!isSafeSlug(slug)) return res.status(400).json({ error: 'Invalid project slug' });
  const projectDir = projectPathFor(slug);
  if (!projectDir || !fs.existsSync(projectDir)) return res.status(404).json({ error: 'Project not found' });
  if (!process.env.GROQ_API_KEY) return res.status(400).json({ error: 'GROQ_API_KEY is missing. Add it to .env and restart the server.' });

  const job = createAnalysisJob(slug, {
    maxChars: Number(req.body.maxChars || 30000),
    model: req.body.model,
  });
  if (!job) return res.status(400).json({ error: 'Raw context is missing. Re-import the project first.' });
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

  let syncWarning = '';
  try {
    await syncRemoteBrain();
  } catch (err) {
    syncWarning = `Remote storage sync failed: ${err.message}`;
  }

  res.json({ deleted: slug, projects: await listProjects(), warning: syncWarning });
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

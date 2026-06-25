const crypto = require('crypto');

const DEFAULT_BUCKET = 'code-brain';
const DEFAULT_PREFIX = 'code-brain';
const DEFAULT_TIMEOUT_MS = 8000;

function envValue(name) {
  return String(process.env[name] || '').trim();
}

function hasUsableValue(value) {
  const text = String(value || '').trim();
  if (!text) return false;
  return !/(your_|_here|placeholder|example|changeme)/i.test(text);
}

function trimSlashes(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '');
}

function normalizeProvider(value) {
  const provider = String(value || 'auto').trim().toLowerCase();
  if (['auto', 'local', 'supabase', 'cloudinary'].includes(provider)) return provider;
  return 'auto';
}

function normalizeSource(value) {
  const source = String(value || 'auto').trim().toLowerCase();
  if (['auto', 'local', 'remote'].includes(source)) return source;
  return 'auto';
}

function supabaseKey() {
  return envValue('SUPABASE_SERVICE_ROLE_KEY')
    || envValue('SUPABASE_SECRET_KEY')
    || envValue('SUPABASE_ANON_KEY')
    || envValue('SUPABASE_PUBLISHABLE_KEY');
}

function supabaseConfigured() {
  return hasUsableValue(envValue('SUPABASE_URL')) && hasUsableValue(supabaseKey());
}

function cloudinaryConfigured() {
  return hasUsableValue(envValue('CLOUDINARY_CLOUD_NAME'))
    && hasUsableValue(envValue('CLOUDINARY_API_KEY'))
    && hasUsableValue(envValue('CLOUDINARY_API_SECRET'));
}

function remotePath(state, relativePath) {
  const prefix = trimSlashes(state.prefix || DEFAULT_PREFIX);
  const rel = trimSlashes(relativePath);
  return prefix ? `${prefix}/${rel}` : rel;
}

function encodeRemotePath(value) {
  return trimSlashes(value).split('/').map(encodeURIComponent).join('/');
}

function getStorageState() {
  const requested = normalizeProvider(envValue('BRAIN_STORAGE_PROVIDER'));
  const autoProvider = supabaseConfigured() ? 'supabase' : (cloudinaryConfigured() ? 'cloudinary' : 'local');
  const provider = requested === 'auto' ? autoProvider : requested;
  const bucket = envValue('BRAIN_STORAGE_BUCKET') || DEFAULT_BUCKET;
  const prefix = trimSlashes(envValue('BRAIN_REMOTE_PREFIX') || DEFAULT_PREFIX);
  const supabaseUrl = envValue('SUPABASE_URL').replace(/\/+$/, '');
  const cloudName = envValue('CLOUDINARY_CLOUD_NAME');
  const writeConfigured = provider === 'supabase'
    ? supabaseConfigured()
    : provider === 'cloudinary'
      ? cloudinaryConfigured()
      : false;
  const configuredManifestUrl = envValue('BRAIN_REMOTE_MANIFEST_URL');
  const computedManifestUrl = writeConfigured ? publicUrlForPath({ provider, bucket, prefix, supabaseUrl, cloudName }, remotePath({ prefix }, 'manifest.json')) : '';
  const manifestUrl = configuredManifestUrl || computedManifestUrl;
  const readSource = normalizeSource(envValue('BRAIN_PROJECT_SOURCE'));
  const readConfigured = readSource !== 'local' && /^https?:\/\//i.test(manifestUrl);

  return {
    provider,
    bucket,
    prefix,
    readSource,
    writeConfigured,
    readConfigured,
    manifestUrl,
    supabaseUrl,
    supabaseKey: supabaseKey(),
    cloudName,
    cloudinaryApiKey: envValue('CLOUDINARY_API_KEY'),
    cloudinaryApiSecret: envValue('CLOUDINARY_API_SECRET'),
    timeoutMs: Number(envValue('BRAIN_REMOTE_TIMEOUT_MS') || DEFAULT_TIMEOUT_MS),
  };
}

function publicStorageState() {
  const state = getStorageState();
  return {
    provider: state.provider,
    bucket: state.bucket,
    prefix: state.prefix,
    readSource: state.readSource,
    writeConfigured: state.writeConfigured,
    readConfigured: state.readConfigured,
    manifestUrl: state.manifestUrl,
  };
}

function publicUrlForPath(state, fullPath) {
  if (state.provider === 'supabase') {
    const base = envValue('BRAIN_STORAGE_PUBLIC_BASE_URL').replace(/\/+$/, '');
    if (base) return `${base}/${encodeRemotePath(fullPath)}`;
    const supabaseUrl = String(state.supabaseUrl || '').replace(/\/+$/, '');
    return `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(state.bucket)}/${encodeRemotePath(fullPath)}`;
  }
  if (state.provider === 'cloudinary') {
    return `https://res.cloudinary.com/${encodeURIComponent(state.cloudName)}/raw/upload/${encodeRemotePath(fullPath)}`;
  }
  return '';
}

function authHeaders(state) {
  return {
    apikey: state.supabaseKey,
    Authorization: `Bearer ${state.supabaseKey}`,
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function responseText(res) {
  return await res.text().catch(() => '');
}

const checkedBuckets = new Set();

async function ensureSupabaseBucket(state) {
  if (checkedBuckets.has(state.bucket)) return;
  const headers = authHeaders(state);
  const bucketUrl = `${state.supabaseUrl}/storage/v1/bucket/${encodeURIComponent(state.bucket)}`;
  const existing = await fetchWithTimeout(bucketUrl, { headers }, state.timeoutMs);
  if (existing.ok) {
    checkedBuckets.add(state.bucket);
    return;
  }
  if (existing.status !== 404) {
    throw new Error(`Supabase bucket check failed (${existing.status}): ${await responseText(existing)}`);
  }

  const created = await fetchWithTimeout(`${state.supabaseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: state.bucket, name: state.bucket, public: true }),
  }, state.timeoutMs);
  if (!created.ok && created.status !== 409) {
    throw new Error(`Supabase bucket create failed (${created.status}): ${await responseText(created)}`);
  }
  checkedBuckets.add(state.bucket);
}

async function uploadSupabaseText(state, fullPath, content, contentType) {
  await ensureSupabaseBucket(state);
  const res = await fetchWithTimeout(`${state.supabaseUrl}/storage/v1/object/${encodeURIComponent(state.bucket)}/${encodeRemotePath(fullPath)}`, {
    method: 'POST',
    headers: {
      ...authHeaders(state),
      'Content-Type': contentType,
      'Cache-Control': '60',
      'x-upsert': 'true',
    },
    body: Buffer.from(content, 'utf8'),
  }, state.timeoutMs);
  if (!res.ok) {
    throw new Error(`Supabase upload failed (${res.status}): ${await responseText(res)}`);
  }
  return publicUrlForPath(state, fullPath);
}

function cloudinarySignature(params, apiSecret) {
  const payload = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
}

async function uploadCloudinaryText(state, fullPath, content, contentType) {
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(state.cloudName)}/raw/upload`;
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    invalidate: 'true',
    overwrite: 'true',
    public_id: fullPath,
    timestamp,
  };
  const form = new FormData();
  form.append('file', new Blob([Buffer.from(content, 'utf8')], { type: contentType }), fullPath.split('/').pop() || 'file.md');
  form.append('api_key', state.cloudinaryApiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', cloudinarySignature(params, state.cloudinaryApiSecret));
  form.append('public_id', fullPath);
  form.append('overwrite', 'true');
  form.append('invalidate', 'true');

  const res = await fetchWithTimeout(endpoint, { method: 'POST', body: form }, state.timeoutMs);
  const body = await res.json().catch(async () => ({ error: { message: await responseText(res) } }));
  if (!res.ok) {
    throw new Error(`Cloudinary upload failed (${res.status}): ${body.error?.message || 'Unknown error'}`);
  }
  return body.secure_url || publicUrlForPath(state, fullPath);
}

async function uploadText(state, relativePath, content, contentType) {
  const fullPath = remotePath(state, relativePath);
  if (state.provider === 'supabase') return uploadSupabaseText(state, fullPath, content, contentType);
  if (state.provider === 'cloudinary') return uploadCloudinaryText(state, fullPath, content, contentType);
  throw new Error('Remote storage provider is not configured.');
}

async function syncProjectsToRemote(projects) {
  const state = getStorageState();
  if (!state.writeConfigured) {
    return {
      skipped: true,
      reason: 'Remote storage is not configured. Add Supabase Storage or Cloudinary credentials in .env.',
      storage: publicStorageState(),
    };
  }

  const manifestProjects = [];
  for (const project of projects) {
    const sections = [];
    for (const section of project.sections || []) {
      if (!section.filename || !section.content) continue;
      const url = await uploadText(
        state,
        `projects/${project.slug}/${section.filename}`,
        section.content,
        'text/markdown; charset=utf-8'
      );
      sections.push({
        key: section.key,
        label: section.label,
        filename: section.filename,
        url,
      });
    }
    manifestProjects.push({
      slug: project.slug,
      title: project.title,
      summary: project.summary,
      meta: project.meta || {},
      sections,
    });
  }

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    provider: state.provider,
    projects: manifestProjects,
  };
  const manifestUrl = await uploadText(
    state,
    'manifest.json',
    `${JSON.stringify(manifest, null, 2)}\n`,
    'application/json; charset=utf-8'
  );

  return {
    skipped: false,
    provider: state.provider,
    manifestUrl,
    projects: manifestProjects.length,
    storage: publicStorageState(),
  };
}

async function fetchJson(url, timeoutMs) {
  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, timeoutMs);
  if (!res.ok) throw new Error(`Remote manifest failed (${res.status}): ${await responseText(res)}`);
  return res.json();
}

async function fetchMarkdown(url, timeoutMs) {
  if (!/^https?:\/\//i.test(String(url || ''))) return '';
  const res = await fetchWithTimeout(url, { headers: { Accept: 'text/markdown,text/plain,*/*' } }, timeoutMs);
  if (!res.ok) throw new Error(`Remote markdown failed (${res.status}): ${await responseText(res)}`);
  return res.text();
}

async function readRemoteProjects() {
  const state = getStorageState();
  if (!state.readConfigured) return null;

  const manifest = await fetchJson(state.manifestUrl, state.timeoutMs);
  const projects = await Promise.all((manifest.projects || []).map(async project => {
    const sections = await Promise.all((project.sections || []).map(async section => ({
      key: section.key,
      label: section.label,
      filename: section.filename,
      url: section.url,
      content: section.content || await fetchMarkdown(section.url, state.timeoutMs),
    })));
    return {
      slug: project.slug,
      title: project.title,
      summary: project.summary,
      meta: project.meta || {},
      sections: sections.filter(section => section.content),
      remote: true,
    };
  }));

  return projects
    .filter(project => project.slug && Array.isArray(project.sections))
    .sort((a, b) => String(a.title || a.slug).localeCompare(String(b.title || b.slug)));
}

module.exports = {
  getStorageState,
  publicStorageState,
  readRemoteProjects,
  syncProjectsToRemote,
};

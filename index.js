import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import axios from 'axios';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RELAY_URL = process.env.VERCEL_RELAY_URL || 'https://rowl-gules.vercel.app/api/repo';
// The relay's default key is kept for quick setup; production deployments can
// override it with ACCESS_KEY in the panel environment.
const ACCESS_KEY = process.env.ACCESS_KEY?.trim() || '123456-P';

// Keep all downloaded code disposable. Bot state lives outside this directory.
const PERSISTENT_ROOT = path.resolve(
  process.env.PROWL_PERSISTENT_DIR || path.join(__dirname, 'data', 'prowl-state')
);
const EXTRACT_ROOT = path.join(PERSISTENT_ROOT, 'feature-cache');
const STATE_ROOT = path.join(PERSISTENT_ROOT, 'bot-state');
const DEPENDENCY_ROOT = path.join(PERSISTENT_ROOT, 'node_modules');
const DEPENDENCY_META = path.join(PERSISTENT_ROOT, 'dependencies.json');

// These are runtime paths commonly written by the extracted PROWL bot.
// They are mounted from STATE_ROOT into each fresh feature download.
const PERSISTENT_DIRECTORIES = [
  'data',
  'config',
  'session',
  'sessions',
  'auth_info_baileys',
  'auth_info'
];
const PERSISTENT_FILES = [
  '.session_id_hash',
  'last_bot_id.json',
  'owner.json',
  'bot_settings.json',
  'bot_mode.json',
  'group.json',
  'settings.json'
];

function fail(message, details = '') {
  console.error(`\n[PROWL] ${message}`);
  if (details) console.error(`[PROWL] ${details}`);
  process.exitCode = 1;
}

function validateConfiguration() {
  if (!/^https?:\/\//i.test(RELAY_URL)) {
    fail('VERCEL_RELAY_URL must be an http(s) URL.', 'Check the private feature-service configuration.');
    return false;
  }
  return true;
}

function findExtractedRoot(container) {
  const entries = fs.readdirSync(container, { withFileTypes: true });
  const directories = entries.filter(entry => entry.isDirectory() && !entry.isSymbolicLink());
  if (directories.length === 1) return path.join(container, directories[0].name);
  if (fs.existsSync(path.join(container, 'index.js'))) return container;
  return null;
}

function ensurePersistentDirectories() {
  fs.mkdirSync(STATE_ROOT, { recursive: true });
  fs.mkdirSync(EXTRACT_ROOT, { recursive: true });
  fs.mkdirSync(DEPENDENCY_ROOT, { recursive: true });
}

function dependencyFingerprint(featureRoot) {
  const hash = crypto.createHash('sha256');
  for (const filename of ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']) {
    const filepath = path.join(featureRoot, filename);
    if (fs.existsSync(filepath)) hash.update(filename).update(fs.readFileSync(filepath));
  }
  return hash.digest('hex');
}

function runNpmInstall(featureRoot) {
  return new Promise((resolve, reject) => {
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawn(npmCommand, [
      'install',
      '--omit=dev',
      '--no-audit',
      '--no-fund',
      '--no-package-lock'
    ], {
      cwd: featureRoot,
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' },
      stdio: 'inherit'
    });
    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`npm install exited with code ${code ?? 'unknown'}`));
    });
  });
}

async function installFeatureDependencies(featureRoot) {
  const packageJsonPath = path.join(featureRoot, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('downloaded feature did not contain package.json');
  }

  const fingerprint = dependencyFingerprint(featureRoot);
  let cachedFingerprint = null;
  try { cachedFingerprint = JSON.parse(fs.readFileSync(DEPENDENCY_META, 'utf8')).fingerprint; } catch {}

  const featureNodeModules = path.join(featureRoot, 'node_modules');
  if (cachedFingerprint === fingerprint && fs.existsSync(path.join(DEPENDENCY_ROOT, 'wolfsocket'))) {
    removePath(featureNodeModules);
    fs.symlinkSync(DEPENDENCY_ROOT, featureNodeModules, 'dir');
    console.log('[PROWL] feature dependencies ready (persistent cache)');
    return;
  }

  removePath(featureNodeModules);
  console.log('[PROWL] installing feature dependencies (first launch or feature update)');
  await runNpmInstall(featureRoot);
  removePath(DEPENDENCY_ROOT);
  fs.renameSync(featureNodeModules, DEPENDENCY_ROOT);
  fs.symlinkSync(DEPENDENCY_ROOT, featureNodeModules, 'dir');
  fs.writeFileSync(DEPENDENCY_META, JSON.stringify({ fingerprint, installedAt: new Date().toISOString() }, null, 2));
  console.log('[PROWL] feature dependencies installed');
}

function copyIfStateIsMissing(source, destination) {
  if (!fs.existsSync(source) || fs.existsSync(destination)) return;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force: false });
}

function removePath(target) {
  if (!fs.existsSync(target) && !fs.lstatSync(target, { throwIfNoEntry: false })) return;
  fs.rmSync(target, { recursive: true, force: true });
}

function mountPersistentState(featureRoot) {
  ensurePersistentDirectories();

  for (const relativePath of PERSISTENT_DIRECTORIES) {
    const featurePath = path.join(featureRoot, relativePath);
    const statePath = path.join(STATE_ROOT, relativePath);
    copyIfStateIsMissing(featurePath, statePath);
    removePath(featurePath);
    fs.mkdirSync(path.dirname(featurePath), { recursive: true });
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.mkdirSync(statePath, { recursive: true });
    fs.symlinkSync(statePath, featurePath, 'dir');
  }

  for (const relativePath of PERSISTENT_FILES) {
    const featurePath = path.join(featureRoot, relativePath);
    const statePath = path.join(STATE_ROOT, relativePath);
    copyIfStateIsMissing(featurePath, statePath);
    removePath(featurePath);
    fs.mkdirSync(path.dirname(featurePath), { recursive: true });
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.symlinkSync(statePath, featurePath, 'file');
  }

  console.log(`[PROWL] persistent state mounted: ${path.relative(__dirname, STATE_ROOT) || STATE_ROOT}`);
}

function migrateLegacyCacheState() {
  // Older loader versions stored the extracted project under node_modules.
  // Copy known state paths before that disposable cache is removed.
  const legacyRoot = path.join(__dirname, 'node_modules', '.prowl-feature-cache');
  if (!fs.existsSync(legacyRoot)) return;
  const legacyFeatureRoot = findExtractedRoot(legacyRoot);
  if (!legacyFeatureRoot) return;
  ensurePersistentDirectories();
  for (const relativePath of [...PERSISTENT_DIRECTORIES, ...PERSISTENT_FILES]) {
    copyIfStateIsMissing(
      path.join(legacyFeatureRoot, relativePath),
      path.join(STATE_ROOT, relativePath)
    );
  }
  console.log('[PROWL] migrated runtime state from the previous loader cache');
}

async function downloadFeature() {
  migrateLegacyCacheState();
  ensurePersistentDirectories();
  fs.rmSync(EXTRACT_ROOT, { recursive: true, force: true });
  fs.mkdirSync(EXTRACT_ROOT, { recursive: true });
  console.log('[PROWL] syncing feature from private service');

  let response;
  try {
    response = await axios.get(RELAY_URL, {
      responseType: 'arraybuffer',
      headers: {
        'x-access-key': ACCESS_KEY,
        'User-Agent': 'PROWL-Feature-Loader/1.1',
        Accept: 'application/zip, application/octet-stream'
      },
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024,
      validateStatus: () => true
    });
  } catch (error) {
    throw new Error(`relay request failed: ${error.code || error.message}`);
  }

  if (response.status === 403) {
    const body = Buffer.from(response.data || '').toString('utf8').slice(0, 300);
    throw new Error(
      `relay returned HTTP 403 Forbidden. ACCESS_KEY must exactly match the relay's ACCESS_KEY and the request must include x-access-key. Relay response: ${body || '(empty)'}`
    );
  }
  if (response.status < 200 || response.status >= 300) {
    const body = Buffer.from(response.data || '').toString('utf8').slice(0, 300);
    throw new Error(`relay returned HTTP ${response.status}: ${body || '(empty)'}`);
  }

  const archive = new AdmZip(Buffer.from(response.data));
  archive.extractAllTo(EXTRACT_ROOT, true);
  const extractedRoot = findExtractedRoot(EXTRACT_ROOT);
  if (!extractedRoot || !fs.existsSync(path.join(extractedRoot, 'index.js'))) {
    throw new Error('relay ZIP did not contain an extracted index.js');
  }

  mountPersistentState(extractedRoot);
  await installFeatureDependencies(extractedRoot);
  console.log(`[PROWL] feature synced: ${path.relative(__dirname, extractedRoot)}`);
  return extractedRoot;
}

async function launch() {
  if (!validateConfiguration()) return;
  try {
    if (!process.env.SESSION_ID?.trim()) {
      console.log('[PROWL] no SESSION_ID supplied; starting system pairing mode');
    } else {
      console.log('[PROWL] SESSION_ID supplied; starting with session injection');
    }
    const featureRoot = await downloadFeature();
    process.chdir(featureRoot);
    console.log('[PROWL] launching extracted feature with persistent state');
    await import(pathToFileURL(path.join(featureRoot, 'index.js')).href);
  } catch (error) {
    fail('feature launch failed', error.message);
  }
}

await launch();

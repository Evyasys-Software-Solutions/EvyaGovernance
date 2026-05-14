/**
 * Layered config loader for Evyasys.
 *
 * Resolution order (highest priority first):
 *   1. process.env                              (CI / shell exports)
 *   2. ~/.evyasys/credentials                   (per-user, secrets — PAT lives here)
 *   3. <project>/.evyasys/project.yaml          (per-project, checked into the project repo)
 *   4. Plugin defaults                          (this folder's .ai/manifest.yaml)
 *
 * Notes:
 * - The PAT is intentionally NOT read from project files. Each user supplies their own.
 * - The Teams webhook IS read from the project file (different channel per project).
 * - Default mode is LIVE. Set EVYASYS_DRY_RUN=1 to preview without external calls.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');

function findPluginRoot(start) {
  let cur = start;
  while (cur && cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, '.claude-plugin', 'plugin.json'))) return cur;
    cur = path.dirname(cur);
  }
  return start;
}

// Tiny YAML reader supporting flat key: value and one-level nested indented keys.
// Avoids a yaml dep so the plugin stays vendor-free.
function readSimpleYaml(file) {
  if (!fs.existsSync(file)) return {};
  const text = fs.readFileSync(file, 'utf8');
  const root = {};
  let currentKey = null;
  for (let raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, '').replace(/^\s*#.*$/, '').replace(/\s+$/, '');
    if (!line.trim()) continue;
    const indented = /^\s+/.test(line);
    const m = line.replace(/^\s+/, '').match(/^([A-Za-z0-9_\-.]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (!indented) {
      currentKey = key;
      if (val === '') root[key] = {};
      else root[key] = val;
    } else if (currentKey && typeof root[currentKey] === 'object') {
      root[currentKey][key] = val;
    }
  }
  return root;
}

function readEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^["'](.*)["']$/, '$1');
  }
  return out;
}

function userCredsPath() {
  return path.join(os.homedir(), '.evyasys', 'credentials');
}

async function prompt(question) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) return resolve('');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (a) => { rl.close(); resolve(a.trim()); });
  });
}

function writeUserCreds(updates) {
  const file = userCredsPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const existing = readEnvFile(file);
  const merged = { ...existing, ...updates };
  const body = Object.entries(merged).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
  fs.writeFileSync(file, body, { mode: 0o600 });
  try { fs.chmodSync(file, 0o600); } catch (_) { /* windows */ }
  return file;
}

async function loadConfig({ ctx } = {}) {
  const pluginRoot = findPluginRoot(__dirname);

  const repoRoot = process.env.EVYASYS_REPO_ROOT || process.env.EVYA_REPO_ROOT || process.cwd();

  // 1. Plugin defaults
  const manifest = readSimpleYaml(path.join(pluginRoot, '.ai', 'manifest.yaml'));

  // 2. Project file (.evyasys/project.yaml)
  const projectFile = path.join(repoRoot, '.evyasys', 'project.yaml');
  const project = readSimpleYaml(projectFile);

  // 3. User creds (~/.evyasys/credentials) — secrets only
  const userCreds = readEnvFile(userCredsPath());

  // Resolve effective values
  const dryRunRaw = process.env.EVYASYS_DRY_RUN ?? process.env.EVYA_DRY_RUN;
  const dryRun = dryRunRaw === undefined
    ? (manifest.mode && manifest.mode.dry_run === 'true')
    : dryRunRaw === '1';

  const azure = {
    org: process.env.AZURE_ORG || userCreds.AZURE_ORG || (project.azure_devops && project.azure_devops.org) || '',
    project: process.env.AZURE_PROJECT || userCreds.AZURE_PROJECT || (project.azure_devops && project.azure_devops.project) || '',
    pat: process.env.AZURE_PAT || userCreds.AZURE_PAT || '',
  };

  const teams = {
    // Resolution: env var > project.yaml > ~/.evyasys/credentials (default webhook)
    webhook: process.env.TEAMS_WEBHOOK
          || (project.teams && project.teams.webhook)
          || userCreds.TEAMS_WEBHOOK
          || '',
  };

  return {
    pluginRoot,
    repoRoot,
    dryRun,
    project: {
      name: project.name || '',
      storyIdPrefix: (project.story && project.story.id_prefix) || 'EVYA',
      raw: project,
      file: projectFile,
    },
    azure,
    teams,
    userCreds: { file: userCredsPath() },
    _ctx: ctx,
  };
}

/**
 * Ensure AZURE_PAT is available; prompt once and persist to ~/.evyasys/credentials.
 * Safe to call repeatedly; no-ops if PAT is already set.
 */
async function ensurePat(cfg /*, ctx */) {
  if (cfg.azure.pat) return cfg.azure.pat;
  if (cfg.dryRun) return ''; // dry-run doesn't actually call ADO
  // eslint-disable-next-line no-console
  console.log('\nAzure DevOps PAT is required for live calls.');
  console.log('Generate one at: https://dev.azure.com/<org>/_usersSettings/tokens');
  console.log('Scope needed: Work Items (Read & write).');
  const pat = await prompt('Paste your PAT (will be saved to ~/.evyasys/credentials, mode 0600): ');
  if (!pat) throw new Error('No PAT provided.');
  writeUserCreds({ AZURE_PAT: pat });
  cfg.azure.pat = pat;
  return pat;
}

/**
 * Ensure the project's Teams webhook is set in .evyasys/project.yaml.
 * If absent, prompt and write it back so the rest of the team picks it up via git.
 */
async function ensureTeamsWebhook(cfg /*, ctx */) {
  if (cfg.teams.webhook) return cfg.teams.webhook;
  if (cfg.dryRun) return '';
  // eslint-disable-next-line no-console
  console.log(`\nNo Teams webhook found for project "${cfg.project.name || cfg.repoRoot}".`);
  console.log('Channel → Connectors → Incoming Webhook → copy the URL.');
  const url = await prompt('Paste the Teams webhook URL (will be saved to .evyasys/project.yaml): ');
  if (!url) throw new Error('No webhook provided.');
  // Append to project.yaml in the simplest possible way (works with our reader).
  const projFile = cfg.project.file;
  fs.mkdirSync(path.dirname(projFile), { recursive: true });
  let body = fs.existsSync(projFile) ? fs.readFileSync(projFile, 'utf8') : '';
  if (!/^\s*teams\s*:/m.test(body)) {
    body += (body.endsWith('\n') ? '' : '\n') + `\nteams:\n  webhook: "${url}"\n`;
  } else {
    body = body.replace(/(^\s*teams\s*:\s*$)([\s\S]*?)(?=^\S|^$|\Z)/m, (full, hdr, inner) => {
      if (/^\s*webhook\s*:/m.test(inner)) {
        return full.replace(/(^\s*webhook\s*:\s*).*$/m, `$1"${url}"`);
      }
      return `${hdr}\n  webhook: "${url}"\n${inner.replace(/^\n/, '')}`;
    });
  }
  fs.writeFileSync(projFile, body);
  cfg.teams.webhook = url;
  return url;
}

module.exports = { loadConfig, ensurePat, ensureTeamsWebhook };

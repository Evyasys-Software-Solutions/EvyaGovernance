/**
 * Layered config loader for Evyasys.
 *
 * Resolution order (highest priority first):
 *   1. process.env                              (CI / shell exports)
 *   2. ~/.evyasys/credentials                   (per-user, secrets — encrypted)
 *   3. <project>/.evyasys/project.yaml          (per-project, checked into the project repo)
 *   4. Plugin defaults                          (this folder's .ai/manifest.yaml)
 *
 * Supported PM tools:   local | devops | jira | github
 * Supported notify tools: none | teams | slack | whatsapp | email
 *
 * Sensitive credentials (PAT, API tokens, auth tokens) are stored encrypted in
 * ~/.evyasys/credentials using AES-256-CBC with a machine-derived key.
 * Non-sensitive config (tool selection, org names, webhook URLs) lives in project.yaml.
 */
const fs      = require('fs');
const os      = require('os');
const path    = require('path');
const readline = require('readline');
const { encrypt, decrypt } = require('./encrypt');

function findPluginRoot(start) {
  let cur = start;
  while (cur && cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, '.claude-plugin', 'plugin.json'))) return cur;
    cur = path.dirname(cur);
  }
  return start;
}

// Tiny YAML reader supporting flat key: value and one-level nested indented keys.
function readSimpleYaml(file) {
  if (!fs.existsSync(file)) return {};
  const text = fs.readFileSync(file, 'utf8');
  const root = {};
  let currentKey = null;
  for (const raw of text.split(/\r?\n/)) {
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
      root[key] = val === '' ? {} : val;
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

/** Read user credentials, decrypting any encrypted values. */
function readUserCreds() {
  const raw = readEnvFile(userCredsPath());
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k] = decrypt(v);
  }
  return out;
}

async function prompt(question) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) return resolve('');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (a) => { rl.close(); resolve(a.trim()); });
  });
}

/** Write credentials to ~/.evyasys/credentials, encrypting all values. */
function writeUserCreds(updates) {
  const file = userCredsPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const existing = readUserCreds();
  const merged = { ...existing, ...updates };
  const body = Object.entries(merged).map(([k, v]) => `${k}=${encrypt(v)}`).join('\n') + '\n';
  fs.writeFileSync(file, body, { mode: 0o600 });
  try { fs.chmodSync(file, 0o600); } catch (_) { /* windows */ }
  return file;
}

async function loadConfig({ ctx } = {}) {
  const pluginRoot = findPluginRoot(__dirname);
  const repoRoot   = process.env.EVYASYS_REPO_ROOT || process.env.EVYA_REPO_ROOT || process.cwd();

  const manifest    = readSimpleYaml(path.join(pluginRoot, '.ai', 'manifest.yaml'));
  const projectFile = path.join(repoRoot, '.evyasys', 'project.yaml');
  const project     = readSimpleYaml(projectFile);
  const userCreds   = readUserCreds();

  const dryRunRaw = process.env.EVYASYS_DRY_RUN ?? process.env.EVYA_DRY_RUN;
  const dryRun    = dryRunRaw === undefined
    ? (manifest.mode && manifest.mode.dry_run === 'true')
    : dryRunRaw === '1';

  // ── PM tool — backward compat: if azure_devops is configured and no pm_tool set, default to devops ──
  const pmToolRaw = process.env.EVYASYS_PM_TOOL
    || project.pm_tool
    || (project.azure_devops && (project.azure_devops.org || project.azure_devops.project) ? 'devops' : 'local');
  const pmTool = pmToolRaw.toLowerCase();

  // ── Notification tool — backward compat: if teams webhook present and no notification_tool set, default to teams ──
  const notifyToolRaw = process.env.EVYASYS_NOTIFY_TOOL
    || project.notification_tool
    || ((project.teams && project.teams.webhook) || process.env.TEAMS_WEBHOOK || userCreds.TEAMS_WEBHOOK ? 'teams' : 'none');
  const notificationTool = notifyToolRaw.toLowerCase();

  // ── Azure DevOps ─────────────────────────────────────────────────────────────
  const azure = {
    org:     process.env.AZURE_ORG     || userCreds.AZURE_ORG     || (project.azure_devops && project.azure_devops.org)     || '',
    project: process.env.AZURE_PROJECT || userCreds.AZURE_PROJECT || (project.azure_devops && project.azure_devops.project) || '',
    pat:     process.env.AZURE_PAT     || userCreds.AZURE_PAT     || '',
  };

  // ── Teams ─────────────────────────────────────────────────────────────────────
  const teams = {
    webhook: process.env.TEAMS_WEBHOOK
          || (project.teams && project.teams.webhook)
          || userCreds.TEAMS_WEBHOOK
          || '',
  };

  // ── JIRA ──────────────────────────────────────────────────────────────────────
  const jira = {
    domain:     process.env.JIRA_DOMAIN      || (project.jira && project.jira.domain)       || '',
    projectKey: process.env.JIRA_PROJECT_KEY || (project.jira && project.jira.project_key)  || '',
    email:      process.env.JIRA_EMAIL       || userCreds.JIRA_EMAIL                         || '',
    apiToken:   process.env.JIRA_API_TOKEN   || userCreds.JIRA_API_TOKEN                     || '',
  };

  // ── GitHub Projects ───────────────────────────────────────────────────────────
  const github = {
    owner:         process.env.GITHUB_OWNER          || (project.github && project.github.owner)          || '',
    repo:          process.env.GITHUB_REPO           || (project.github && project.github.repo)           || '',
    projectNumber: process.env.GITHUB_PROJECT_NUMBER || (project.github && project.github.project_number) || '',
    token:         process.env.GITHUB_TOKEN          || userCreds.GITHUB_TOKEN                             || '',
  };

  // ── Slack ─────────────────────────────────────────────────────────────────────
  const slack = {
    webhook: process.env.SLACK_WEBHOOK
          || (project.slack && project.slack.webhook)
          || userCreds.SLACK_WEBHOOK
          || '',
  };

  // ── WhatsApp (via Twilio) ─────────────────────────────────────────────────────
  const whatsapp = {
    accountSid: process.env.TWILIO_ACCOUNT_SID  || userCreds.TWILIO_ACCOUNT_SID  || '',
    authToken:  process.env.TWILIO_AUTH_TOKEN   || userCreds.TWILIO_AUTH_TOKEN   || '',
    from:       process.env.WHATSAPP_FROM       || (project.whatsapp && project.whatsapp.from) || '',
    to:         process.env.WHATSAPP_TO         || (project.whatsapp && project.whatsapp.to)   || '',
  };

  // ── Email (via SMTP / nodemailer) ─────────────────────────────────────────────
  const email = {
    smtpHost:     process.env.EMAIL_SMTP_HOST     || (project.email && project.email.smtp_host)     || '',
    smtpPort:     process.env.EMAIL_SMTP_PORT     || (project.email && project.email.smtp_port)     || '587',
    smtpUser:     process.env.EMAIL_SMTP_USER     || userCreds.EMAIL_SMTP_USER                       || '',
    smtpPassword: process.env.EMAIL_SMTP_PASSWORD || userCreds.EMAIL_SMTP_PASSWORD                   || '',
    from:         process.env.EMAIL_FROM          || (project.email && project.email.from)           || '',
    to:           process.env.EMAIL_TO            || (project.email && project.email.to)             || '',
  };

  // ── Release Notes (PDF generation config) ────────────────────────────────────
  const rn = project.release_notes || {};
  const releaseNotes = {
    companyName:       process.env.RELEASE_COMPANY_NAME  || rn.company_name        || project.name || '',
    logoPath:          process.env.RELEASE_LOGO_PATH     || rn.logo_path           || '',
    brandColor:        process.env.RELEASE_BRAND_COLOR   || rn.brand_color         || '#0078d4',
    outputDir:         process.env.RELEASE_OUTPUT_DIR    || rn.output_dir          || '.evyasys/releases',
    namingConvention:  process.env.RELEASE_NAMING_CONV   || rn.naming_convention   || 'v{version}',
  };

  const wit = project.work_item_types || {};

  // ── Project health flags (used by session-start for onboarding guidance) ─────
  const evyasysDir    = path.join(repoRoot, '.evyasys');
  const hasEvyasysDir = fs.existsSync(evyasysDir);
  const hasProjectYaml = fs.existsSync(projectFile);
  const hasDocs       = fs.existsSync(path.join(evyasysDir, 'docs'));
  // True only if project.yaml has an explicit pm_tool or legacy azure_devops block.
  const isConfigured  = !!(project.pm_tool || project.azure_devops || project.jira || project.github);

  return {
    pluginRoot,
    repoRoot,
    dryRun,
    pmTool,
    notificationTool,
    hasEvyasysDir,
    hasProjectYaml,
    hasDocs,
    isConfigured,
    project: {
      name:          project.name || '',
      storyIdPrefix: (project.story && project.story.id_prefix) || 'EVYA',
      raw:           project,
      file:          projectFile,
    },
    azure,
    teams,
    jira,
    github,
    slack,
    whatsapp,
    email,
    releaseNotes,
    workItemTypes: {
      epic:  process.env.ADO_TYPE_EPIC  || wit.epic  || 'Epic',
      story: process.env.ADO_TYPE_STORY || wit.story || 'User Story',
      task:  process.env.ADO_TYPE_TASK  || wit.task  || 'Task',
    },
    userCreds: { file: userCredsPath() },
    _ctx: ctx,
  };
}

// ── Credential helpers ────────────────────────────────────────────────────────

async function ensurePat(cfg) {
  if (cfg.azure.pat) return cfg.azure.pat;
  if (cfg.dryRun) return '';
  console.log('\nAzure DevOps PAT is required.');
  console.log('Generate one at: https://dev.azure.com/<org>/_usersSettings/tokens (scope: Work Items Read & write).');
  const pat = await prompt('Paste your PAT (saved encrypted to ~/.evyasys/credentials): ');
  if (!pat) throw new Error('No PAT provided.');
  writeUserCreds({ AZURE_PAT: pat });
  cfg.azure.pat = pat;
  return pat;
}

async function ensureJiraCreds(cfg) {
  if (cfg.jira.email && cfg.jira.apiToken) return;
  if (cfg.dryRun) return;
  if (!cfg.jira.domain) {
    const domain = await prompt('JIRA domain (e.g. your-org.atlassian.net): ');
    if (!domain) throw new Error('No JIRA domain provided.');
    cfg.jira.domain = domain;
  }
  if (!cfg.jira.email) {
    const email = await prompt('JIRA account email: ');
    if (!email) throw new Error('No JIRA email provided.');
    cfg.jira.email = email;
    writeUserCreds({ JIRA_EMAIL: email });
  }
  if (!cfg.jira.apiToken) {
    console.log('Generate an API token at: https://id.atlassian.com/manage-profile/security/api-tokens');
    const token = await prompt('JIRA API token (saved encrypted to ~/.evyasys/credentials): ');
    if (!token) throw new Error('No JIRA API token provided.');
    writeUserCreds({ JIRA_API_TOKEN: token });
    cfg.jira.apiToken = token;
  }
}

async function ensureGitHubToken(cfg) {
  if (cfg.github.token) return;
  if (cfg.dryRun) return;
  console.log('Generate a GitHub PAT at: https://github.com/settings/tokens (scope: repo, project).');
  const token = await prompt('GitHub personal access token (saved encrypted to ~/.evyasys/credentials): ');
  if (!token) throw new Error('No GitHub token provided.');
  writeUserCreds({ GITHUB_TOKEN: token });
  cfg.github.token = token;
}

async function ensureSlackWebhook(cfg) {
  if (cfg.slack.webhook) return;
  if (cfg.dryRun) return;
  console.log('Create an incoming webhook at: https://api.slack.com/messaging/webhooks');
  const url = await prompt('Slack webhook URL (will be saved to .evyasys/project.yaml): ');
  if (!url) throw new Error('No Slack webhook provided.');
  _writeProjectYaml(cfg, { slack: { webhook: url } });
  cfg.slack.webhook = url;
}

async function ensureTeamsWebhook(cfg) {
  if (cfg.teams.webhook) return;
  if (cfg.dryRun) return;
  console.log(`\nNo Teams webhook found for project "${cfg.project.name || cfg.repoRoot}".`);
  console.log('Channel → Connectors → Incoming Webhook → copy the URL.');
  const url = await prompt('Paste the Teams webhook URL (will be saved to .evyasys/project.yaml): ');
  if (!url) throw new Error('No webhook provided.');
  _writeProjectYaml(cfg, { teams: { webhook: url } });
  cfg.teams.webhook = url;
}

async function ensureWhatsAppCreds(cfg) {
  if (cfg.whatsapp.accountSid && cfg.whatsapp.authToken) return;
  if (cfg.dryRun) return;
  console.log('Twilio WhatsApp — get credentials at: https://console.twilio.com/');
  if (!cfg.whatsapp.accountSid) {
    const sid = await prompt('Twilio Account SID: ');
    if (!sid) throw new Error('No Twilio Account SID provided.');
    writeUserCreds({ TWILIO_ACCOUNT_SID: sid });
    cfg.whatsapp.accountSid = sid;
  }
  if (!cfg.whatsapp.authToken) {
    const token = await prompt('Twilio Auth Token (saved encrypted): ');
    if (!token) throw new Error('No Twilio Auth Token provided.');
    writeUserCreds({ TWILIO_AUTH_TOKEN: token });
    cfg.whatsapp.authToken = token;
  }
  if (!cfg.whatsapp.from) {
    const from = await prompt('WhatsApp from number (e.g. +14155238886): ');
    if (!from) throw new Error('No from number provided.');
    cfg.whatsapp.from = from;
  }
  if (!cfg.whatsapp.to) {
    const to = await prompt('WhatsApp to number (team recipient, e.g. +1234567890): ');
    if (!to) throw new Error('No to number provided.');
    cfg.whatsapp.to = to;
  }
}

async function ensureEmailCreds(cfg) {
  if (cfg.email.smtpHost && cfg.email.smtpUser && cfg.email.smtpPassword && cfg.email.to) return;
  if (cfg.dryRun) return;
  const yamlUpdates = { email: {} };
  console.log('\nEmail (SMTP) notification details needed.');
  if (!cfg.email.to) {
    const to = await prompt('Recipient address for team notifications (e.g. team@yourcompany.com): ');
    if (!to) throw new Error('No recipient address provided.');
    cfg.email.to = to;
    yamlUpdates.email.to = to;
  }
  if (!cfg.email.smtpHost) {
    const host = await prompt('SMTP host (e.g. smtp.gmail.com, smtp.office365.com): ');
    if (!host) throw new Error('No SMTP host provided.');
    cfg.email.smtpHost = host;
    yamlUpdates.email.smtp_host = host;
  }
  if (!cfg.email.smtpPort) {
    const port = await prompt('SMTP port [587]: ');
    cfg.email.smtpPort = port || '587';
    yamlUpdates.email.smtp_port = cfg.email.smtpPort;
  }
  if (!cfg.email.smtpUser) {
    const user = await prompt('SMTP username / login email: ');
    if (!user) throw new Error('No SMTP username provided.');
    writeUserCreds({ EMAIL_SMTP_USER: user });
    cfg.email.smtpUser = user;
    if (!cfg.email.from) {
      cfg.email.from = user;
      yamlUpdates.email.from = user;
    }
  }
  if (!cfg.email.smtpPassword) {
    console.log('  (Gmail: use an App Password from https://myaccount.google.com/apppasswords)');
    const pass = await prompt('SMTP password or app password (saved encrypted): ');
    if (!pass) throw new Error('No SMTP password provided.');
    writeUserCreds({ EMAIL_SMTP_PASSWORD: pass });
    cfg.email.smtpPassword = pass;
  }
  if (Object.keys(yamlUpdates.email).length > 0) {
    _writeProjectYaml(cfg, yamlUpdates);
  }
}

/** Write one or more section.key values into project.yaml without clobbering unrelated content. */
function _writeProjectYaml(cfg, updates) {
  const projFile = cfg.project.file;
  fs.mkdirSync(path.dirname(projFile), { recursive: true });
  let body = fs.existsSync(projFile) ? fs.readFileSync(projFile, 'utf8') : '';
  for (const [section, keys] of Object.entries(updates)) {
    for (const [key, value] of Object.entries(keys)) {
      const quoted = `"${value}"`;
      const sectionRe = new RegExp(`^(${section}\\s*:\\s*$)`, 'm');
      const keyRe     = new RegExp(`^(\\s+${key}\\s*:\\s*).*$`, 'm');
      if (sectionRe.test(body)) {
        if (keyRe.test(body)) {
          body = body.replace(keyRe, `$1${quoted}`);
        } else {
          body = body.replace(sectionRe, `$1\n  ${key}: ${quoted}`);
        }
      } else {
        body += (body.endsWith('\n') ? '' : '\n') + `\n${section}:\n  ${key}: ${quoted}\n`;
      }
    }
  }
  fs.writeFileSync(projFile, body);
}

module.exports = {
  loadConfig,
  writeUserCreds,
  readUserCreds,
  prompt,
  ensurePat,
  ensureJiraCreds,
  ensureGitHubToken,
  ensureSlackWebhook,
  ensureTeamsWebhook,
  ensureWhatsAppCreds,
  ensureEmailCreds,
};

/**
 * Post-agent hook for evyasys-setup.
 *
 * Parses the <!-- EVYACONFIG { ... } --> block from the agent output and saves:
 *   - Non-sensitive values to .evyasys/project.yaml  (safe to commit)
 *   - Sensitive credentials encrypted to ~/.evyasys/credentials  (never committed)
 *
 * Merges into existing config — never clobbers values not present in the block.
 *
 * Config block format (all fields present, unused ones as ""):
 * <!-- EVYACONFIG
 * {
 *   "pm_tool": "local|devops|jira|github",
 *   "azure_org": "", "azure_project": "", "azure_pat": "",
 *   "jira_domain": "", "jira_project_key": "", "jira_email": "", "jira_api_token": "",
 *   "github_owner": "", "github_repo": "", "github_project_number": "", "github_token": "",
 *   "notification_tool": "none|teams|slack|whatsapp|email",
 *   "teams_webhook": "",
 *   "slack_webhook": "",
 *   "twilio_account_sid": "", "twilio_auth_token": "", "whatsapp_from": "", "whatsapp_to": "",
 *   "email_smtp_host": "", "email_smtp_port": "", "email_smtp_user": "", "email_smtp_password": "",
 *   "email_from": "", "email_to": ""
 * }
 * -->
 */
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { loadConfig, writeUserCreds } = require('../../scripts/lib/config');
const { ensureCompress } = require('../../scripts/lib/ensure-compress');

function parseConfigBlock(text) {
  const m = text && text.match(/<!--\s*EVYACONFIG\s*([\s\S]*?)-->/i);
  if (!m) return null;
  try {
    return JSON.parse(m[1].trim());
  } catch {
    return null;
  }
}

/**
 * Update/insert key: value lines in a simple YAML file without clobbering
 * unrelated content. Supports one level of indented sections.
 *
 * `updates` shape:
 *   { _top: { key: value }, sectionName: { key: value }, ... }
 */
function mergeProjectYaml(projFile, updates) {
  fs.mkdirSync(path.dirname(projFile), { recursive: true });
  let body = fs.existsSync(projFile) ? fs.readFileSync(projFile, 'utf8') : '';

  // Top-level scalar keys.
  for (const [key, value] of Object.entries(updates._top || {})) {
    if (value === '' || value == null) continue;
    const quoted = `"${String(value).replace(/"/g, '\\"')}"`;
    const re = new RegExp(`^(${key}\\s*:\\s*).*$`, 'm');
    if (re.test(body)) {
      body = body.replace(re, `$1${quoted}`);
    } else {
      body += (body.endsWith('\n') ? '' : '\n') + `${key}: ${quoted}\n`;
    }
  }

  // Indented section keys.
  for (const [section, entries] of Object.entries(updates)) {
    if (section === '_top') continue;
    for (const [key, value] of Object.entries(entries)) {
      if (value === '' || value == null) continue;
      const quoted = `"${String(value).replace(/"/g, '\\"')}"`;
      const sectionRe = new RegExp(`^(${section}\\s*:\\s*)$`, 'm');
      const keyRe     = new RegExp(`^(\\s+${key}\\s*:\\s*).*$`, 'm');

      if (sectionRe.test(body)) {
        // Section exists.
        if (keyRe.test(body)) {
          body = body.replace(keyRe, `$1${quoted}`);
        } else {
          body = body.replace(sectionRe, `$1\n  ${key}: ${quoted}`);
        }
      } else {
        // Section missing — append.
        body += (body.endsWith('\n') ? '' : '\n') + `\n${section}:\n  ${key}: ${quoted}\n`;
      }
    }
  }

  fs.writeFileSync(projFile, body, 'utf8');
}

module.exports = async function (ctx) {
  const cfg    = await loadConfig({ ctx });
  const output = ctx.agentResult || '';

  const config = parseConfigBlock(output);
  if (!config) {
    ctx.send(
      'No EVYACONFIG block found in agent output — nothing was saved.\n' +
      'Ask the agent to complete the setup wizard and output the configuration block.'
    );
    return;
  }

  const pmTool           = (config.pm_tool || 'local').toLowerCase();
  const notificationTool = (config.notification_tool || 'none').toLowerCase();

  // ── Write project.yaml (non-sensitive — safe to commit) ──────────────────────
  const yamlUpdates = {
    _top: {
      pm_tool:           pmTool,
      notification_tool: notificationTool,
    },
  };

  if (pmTool === 'devops') {
    yamlUpdates.azure_devops = {};
    if (config.azure_org)     yamlUpdates.azure_devops.org     = config.azure_org;
    if (config.azure_project) yamlUpdates.azure_devops.project = config.azure_project;
  }

  if (pmTool === 'jira') {
    yamlUpdates.jira = {};
    if (config.jira_domain)      yamlUpdates.jira.domain      = config.jira_domain;
    if (config.jira_project_key) yamlUpdates.jira.project_key = config.jira_project_key;
  }

  if (pmTool === 'github') {
    yamlUpdates.github = {};
    if (config.github_owner)          yamlUpdates.github.owner          = config.github_owner;
    if (config.github_repo)           yamlUpdates.github.repo           = config.github_repo;
    if (config.github_project_number) yamlUpdates.github.project_number = config.github_project_number;
  }

  if (notificationTool === 'teams' && config.teams_webhook) {
    yamlUpdates.teams = { webhook: config.teams_webhook };
  }
  if (notificationTool === 'slack' && config.slack_webhook) {
    yamlUpdates.slack = { webhook: config.slack_webhook };
  }
  if (notificationTool === 'whatsapp') {
    yamlUpdates.whatsapp = {};
    if (config.whatsapp_from) yamlUpdates.whatsapp.from = config.whatsapp_from;
    if (config.whatsapp_to)   yamlUpdates.whatsapp.to   = config.whatsapp_to;
  }

  if (notificationTool === 'email') {
    yamlUpdates.email = {};
    if (config.email_smtp_host) yamlUpdates.email.smtp_host = config.email_smtp_host;
    if (config.email_smtp_port) yamlUpdates.email.smtp_port = config.email_smtp_port;
    if (config.email_from)      yamlUpdates.email.from      = config.email_from;
    if (config.email_to)        yamlUpdates.email.to        = config.email_to;
  }

  // ── Release Notes / PDF branding (non-sensitive — safe to commit) ────────────
  const hasReleaseConfig = config.release_company_name || config.release_logo_path
    || config.release_brand_color || config.release_output_dir || config.release_naming_convention;
  if (hasReleaseConfig) {
    yamlUpdates.release_notes = {};
    if (config.release_company_name)    yamlUpdates.release_notes.company_name       = config.release_company_name;
    if (config.release_logo_path)       yamlUpdates.release_notes.logo_path          = config.release_logo_path;
    if (config.release_brand_color)     yamlUpdates.release_notes.brand_color        = config.release_brand_color;
    if (config.release_output_dir)      yamlUpdates.release_notes.output_dir         = config.release_output_dir;
    if (config.release_naming_convention) yamlUpdates.release_notes.naming_convention = config.release_naming_convention;
  }

  mergeProjectYaml(cfg.project.file, yamlUpdates);
  ctx.send(`Project config saved → ${cfg.project.file}`);

  // ── Write ~/.evyasys/credentials (sensitive — encrypted) ─────────────────────
  const creds = {};
  if (pmTool === 'devops' && config.azure_pat)           creds.AZURE_PAT           = config.azure_pat;
  if (pmTool === 'jira'   && config.jira_email)          creds.JIRA_EMAIL          = config.jira_email;
  if (pmTool === 'jira'   && config.jira_api_token)      creds.JIRA_API_TOKEN      = config.jira_api_token;
  if (pmTool === 'github' && config.github_token)        creds.GITHUB_TOKEN        = config.github_token;
  if (notificationTool === 'whatsapp') {
    if (config.twilio_account_sid) creds.TWILIO_ACCOUNT_SID = config.twilio_account_sid;
    if (config.twilio_auth_token)  creds.TWILIO_AUTH_TOKEN  = config.twilio_auth_token;
  }
  if (notificationTool === 'email') {
    if (config.email_smtp_user)     creds.EMAIL_SMTP_USER     = config.email_smtp_user;
    if (config.email_smtp_password) creds.EMAIL_SMTP_PASSWORD = config.email_smtp_password;
  }

  if (Object.keys(creds).length > 0) {
    writeUserCreds(creds);
    ctx.send(`Credentials encrypted → ${os.homedir()}/.evyasys/credentials`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────────
  const PM_LABELS = {
    local: 'Local folder only', devops: 'Azure DevOps',
    jira:  'JIRA',              github: 'GitHub Projects',
  };
  const N_LABELS = {
    none: 'Not needed', teams: 'Teams',
    slack: 'Slack',     whatsapp: 'WhatsApp',
    email: 'Email',
  };

  const releaseConfigured = !!(config.release_company_name || config.release_brand_color);
  ctx.send(
    `Setup complete for **${cfg.project.name || path.basename(cfg.repoRoot)}**.\n\n` +
    `  PM Tool:           ${PM_LABELS[pmTool]           || pmTool}\n` +
    `  Notification Tool: ${N_LABELS[notificationTool]  || notificationTool}\n` +
    (releaseConfigured ? `  PDF Branding:      ${config.release_company_name || '(configured)'}\n` : '') +
    `\n**Next step:** Run \`/evyasys:TrainDocs\` to scan your codebase and generate the 35 quality-gate documents that all delivery commands depend on.`
  );

  // ── Context compression — only when user preference allows it ────────────────
  // compress_preference values from agent:
  //   "auto"    → Python found; install and register now
  //   "pending" → user chose to install Python later; skip for now
  //   "skip"    → user explicitly opted out; never install
  //   ""        → missing/old config; attempt install (backward compat)
  const compressPref = (config.compress_preference || '').toLowerCase();
  if (compressPref !== 'skip' && compressPref !== 'pending') {
    const compress = ensureCompress();
    if (compress.registered) {
      ctx.send(
        '✅ Context compression enabled — **restart Claude Code once** for it to ' +
        'activate, then token usage is automatically reduced for ReviewDev, ' +
        'CreateSubtask, and StartDev batch.'
      );
    }
  }
};

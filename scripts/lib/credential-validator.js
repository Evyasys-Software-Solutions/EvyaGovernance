/**
 * Credential validator for Evyasys Setup.
 *
 * Validates each integration's credentials with a real API/network call
 * before they are saved. Returns { ok, message, detail } so the caller
 * can surface a clear pass/fail to the user.
 *
 * CLI usage (called by setup hooks and the agent via Bash):
 *   node credential-validator.js ado       --org <org> --pat <pat>
 *   node credential-validator.js jira      --domain <domain> --email <email> --token <token>
 *   node credential-validator.js github    --token <token>
 *   node credential-validator.js teams     --webhook <url>
 *   node credential-validator.js slack     --webhook <url>
 *   node credential-validator.js whatsapp  --account-sid <sid> --auth-token <token>
 *   node credential-validator.js email     --host <host> --port <port> --user <user> --password <pass>
 *
 * Exit code 0 = valid, 1 = invalid / error.
 * stdout: JSON { ok, message, detail }
 */
const { ensurePackage } = require('./ensure-package');

const TIMEOUT_MS = 10_000;

function authBasic(user, pass) {
  return 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
}

async function timedFetch(url, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── Azure DevOps ──────────────────────────────────────────────────────────────

async function validateAdo({ org, pat }) {
  const url = `https://dev.azure.com/${encodeURIComponent(org)}/_apis/projects?api-version=7.1&$top=1`;
  let res;
  try {
    res = await timedFetch(url, { headers: { Authorization: authBasic('', pat), Accept: 'application/json' } });
  } catch (e) {
    return { ok: false, message: `❌ Could not reach Azure DevOps: ${e.message}` };
  }
  if (res.ok) {
    const data = await res.json().catch(() => ({}));
    const count = data.count || '?';
    return { ok: true, message: `✅ Azure DevOps connected — org "${org}" found (${count} project${count !== 1 ? 's' : ''} visible).` };
  }
  if (res.status === 401) return { ok: false, message: `❌ Azure DevOps PAT is invalid or expired. Re-generate at: https://dev.azure.com/${org}/_usersSettings/tokens` };
  if (res.status === 404) return { ok: false, message: `❌ Azure DevOps org "${org}" not found. Check the organisation name (case-sensitive).` };
  return { ok: false, message: `❌ Azure DevOps returned HTTP ${res.status}. Check org name and PAT scope (needs Work Items Read & Write).` };
}

// ── JIRA ──────────────────────────────────────────────────────────────────────

async function validateJira({ domain, email, token }) {
  const base = `https://${domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  const url  = `${base}/rest/api/3/myself`;
  let res;
  try {
    res = await timedFetch(url, { headers: { Authorization: authBasic(email, token), Accept: 'application/json' } });
  } catch (e) {
    return { ok: false, message: `❌ Could not reach JIRA: ${e.message}` };
  }
  if (res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: true, message: `✅ JIRA connected — authenticated as "${data.displayName || email}" on ${domain}.` };
  }
  if (res.status === 401) return { ok: false, message: `❌ JIRA credentials invalid. Check your email and API token at: https://id.atlassian.com/manage-profile/security/api-tokens` };
  if (res.status === 404) return { ok: false, message: `❌ JIRA domain "${domain}" not found. Example format: your-org.atlassian.net` };
  return { ok: false, message: `❌ JIRA returned HTTP ${res.status}. Check domain, email, and API token.` };
}

// ── GitHub ────────────────────────────────────────────────────────────────────

async function validateGitHub({ token }) {
  let res;
  try {
    res = await timedFetch('https://api.github.com/user', {
      headers: {
        Authorization:        `Bearer ${token}`,
        Accept:               'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  } catch (e) {
    return { ok: false, message: `❌ Could not reach GitHub: ${e.message}` };
  }
  if (res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: true, message: `✅ GitHub connected — authenticated as @${data.login || '(unknown)'}.` };
  }
  if (res.status === 401) return { ok: false, message: `❌ GitHub token invalid or expired. Generate a new token at: https://github.com/settings/tokens (scopes: repo, project)` };
  return { ok: false, message: `❌ GitHub returned HTTP ${res.status}. Check token and scopes (needs repo, project).` };
}

// ── Teams webhook ─────────────────────────────────────────────────────────────

async function validateTeams({ webhook }) {
  const body = JSON.stringify({
    '@type':    'MessageCard',
    '@context': 'http://schema.org/extensions',
    summary:    'Evyasys connection test',
    themeColor: '0078d4',
    title:      '🔗 Evyasys — connection test',
    text:       'Setup is complete. This is a one-time verification message from Evyasys. Your team notifications are ready.',
  });
  let res;
  try {
    res = await timedFetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  } catch (e) {
    return { ok: false, message: `❌ Could not reach Teams webhook: ${e.message}` };
  }
  if (res.ok || res.status === 200) {
    return { ok: true, message: `✅ Teams webhook verified — a test card was posted to the channel. Check the channel to confirm.` };
  }
  return { ok: false, message: `❌ Teams webhook failed (HTTP ${res.status}). Check the webhook URL is valid and the connector is still active.` };
}

// ── Slack webhook ─────────────────────────────────────────────────────────────

async function validateSlack({ webhook }) {
  const body = JSON.stringify({
    text: '🔗 *Evyasys — connection test*\nSetup is complete. This is a one-time verification message. Your team notifications are ready.',
  });
  let res;
  try {
    res = await timedFetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  } catch (e) {
    return { ok: false, message: `❌ Could not reach Slack webhook: ${e.message}` };
  }
  if (res.ok) {
    return { ok: true, message: `✅ Slack webhook verified — a test message was posted to the channel. Check the channel to confirm.` };
  }
  return { ok: false, message: `❌ Slack webhook failed (HTTP ${res.status}). Check the webhook URL at: https://api.slack.com/messaging/webhooks` };
}

// ── WhatsApp / Twilio ─────────────────────────────────────────────────────────

async function validateWhatsApp({ accountSid, authToken }) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}.json`;
  let res;
  try {
    res = await timedFetch(url, { headers: { Authorization: authBasic(accountSid, authToken) } });
  } catch (e) {
    return { ok: false, message: `❌ Could not reach Twilio: ${e.message}` };
  }
  if (res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: true, message: `✅ Twilio account verified — Account SID ${accountSid} is active (${data.status || 'active'}).` };
  }
  if (res.status === 401) return { ok: false, message: `❌ Twilio credentials invalid. Check Account SID and Auth Token at: https://console.twilio.com/` };
  return { ok: false, message: `❌ Twilio returned HTTP ${res.status}. Check Account SID and Auth Token.` };
}

// ── Email / SMTP ──────────────────────────────────────────────────────────────

async function validateEmail({ host, port, user, password }) {
  const nodemailer = ensurePackage('nodemailer');
  const transporter = nodemailer.createTransport({
    host,
    port:   Number(port) || 587,
    secure: (Number(port) || 587) === 465,
    auth:   { user, pass: password },
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout:   TIMEOUT_MS,
  });
  try {
    await transporter.verify();
    return { ok: true, message: `✅ SMTP connection verified — ${host}:${port || 587} is reachable and credentials accepted.` };
  } catch (e) {
    const hint = e.message.includes('ECONNREFUSED') ? ' (server refused connection — check host and port)'
               : e.message.includes('ENOTFOUND')    ? ' (hostname not found — check SMTP host)'
               : e.message.includes('535')          ? ' (authentication failed — check username and password)'
               : '';
    return { ok: false, message: `❌ SMTP connection failed: ${e.message}${hint}` };
  }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

const VALIDATORS = { ado: validateAdo, jira: validateJira, github: validateGitHub, teams: validateTeams, slack: validateSlack, whatsapp: validateWhatsApp, email: validateEmail };

async function validate(type, params) {
  const fn = VALIDATORS[type];
  if (!fn) return { ok: false, message: `❌ Unknown credential type: "${type}". Valid: ${Object.keys(VALIDATORS).join(', ')}` };
  try {
    return await fn(params);
  } catch (e) {
    return { ok: false, message: `❌ Validation error: ${e.message}` };
  }
}

module.exports = { validate, validateAdo, validateJira, validateGitHub, validateTeams, validateSlack, validateWhatsApp, validateEmail };

// ── CLI ───────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  const type = args[0];
  const params = {};
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    params[key] = args[i + 1] || '';
  }
  validate(type, params).then(result => {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exit(result.ok ? 0 : 1);
  }).catch(e => {
    process.stdout.write(JSON.stringify({ ok: false, message: `❌ Unexpected error: ${e.message}` }) + '\n');
    process.exit(1);
  });
}

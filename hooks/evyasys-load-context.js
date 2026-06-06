/**
 * Session-start hook for Evyasys.
 *
 * Loads the layered project context that every /evyasys:* command depends on:
 *   1. Plugin defaults  (.ai/{rules,memory,integrations,workflows})
 *   2. Project overlay  (.evyasys/{project.yaml, rules, memory, workflows, inputs})
 *   3. User credentials (~/.evyasys/credentials)
 *
 * Also runs onboarding checks and guides the user through setup if anything is
 * missing — so every command can safely assume the context is ready.
 */
const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { loadConfig } = require('../scripts/lib/config');

const PM_LABELS = {
  local:  'Local folder only',
  devops: 'Azure DevOps',
  jira:   'JIRA',
  github: 'GitHub Projects',
};
const N_LABELS = {
  none:     'Not needed',
  teams:    'Teams',
  slack:    'Slack',
  whatsapp: 'WhatsApp',
  email:    'Email',
};

function readDir(dir, exts = ['.md', '.json', '.yaml', '.yml']) {
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(out, readDir(full, exts));
    else if (exts.includes(path.extname(entry.name))) out[full] = fs.readFileSync(full, 'utf8');
  }
  return out;
}

/** Returns a list of missing-credential descriptions for the configured tools. */
function detectCredGaps(cfg) {
  const gaps = [];
  if (cfg.pmTool === 'devops' && !cfg.azure.pat)
    gaps.push('Azure DevOps PAT (`AZURE_PAT`)');
  if (cfg.pmTool === 'jira' && (!cfg.jira.email || !cfg.jira.apiToken))
    gaps.push('JIRA email / API token');
  if (cfg.pmTool === 'github' && !cfg.github.token)
    gaps.push('GitHub personal access token');
  if (cfg.notificationTool === 'teams' && !cfg.teams.webhook)
    gaps.push('Teams webhook URL');
  if (cfg.notificationTool === 'slack' && !cfg.slack.webhook)
    gaps.push('Slack webhook URL');
  if (cfg.notificationTool === 'whatsapp' && (!cfg.whatsapp.accountSid || !cfg.whatsapp.authToken))
    gaps.push('Twilio Account SID / Auth Token');
  if (cfg.notificationTool === 'email' && (!cfg.email.smtpHost || !cfg.email.smtpUser || !cfg.email.smtpPassword || !cfg.email.to))
    gaps.push('Email SMTP credentials (host, username, password, recipient)');
  return gaps;
}

module.exports = async function (ctx) {
  const cfg = await loadConfig({ ctx });

  // ── Onboarding check ─────────────────────────────────────────────────────────
  // Run before context injection so the user sees guidance even if nothing is set up.
  if (typeof ctx.send === 'function') {
    if (!cfg.hasEvyasysDir) {
      // Brand-new project — nothing exists yet.
      ctx.send(
        `Welcome to Evyasys!\n\n` +
        `This project has no Evyasys setup yet. To get started:\n\n` +
        `  **Step 1:** \`/evyasys:Setup\`\n` +
        `    Choose your Project Management tool (Local / Azure DevOps / JIRA / GitHub)\n` +
        `    and notification channel (Not needed / Teams / Slack / WhatsApp).\n\n` +
        `  **Step 2:** \`/evyasys:TrainDocs\`\n` +
        `    Scan your codebase and generate 25 quality-gate documents.\n` +
        `    All delivery commands (CreateStory → FinishQa) depend on these.\n\n` +
        `Both steps together take under 5 minutes.`
      );
    } else if (!cfg.hasProjectYaml) {
      // .evyasys/ folder exists (e.g. committed by teammate) but user hasn't configured locally.
      ctx.send(
        `Evyasys folder found but \`project.yaml\` is missing.\n` +
        `Run \`/evyasys:Setup\` to configure your PM tool and notification channel for this project.`
      );
    } else if (!cfg.isConfigured) {
      // project.yaml exists but has only default/empty values — Setup was never completed.
      ctx.send(
        `Evyasys project file found but not configured.\n` +
        `Run \`/evyasys:Setup\` to choose your PM tool and notification channel.`
      );
    } else {
      // Configured — check for credential gaps and missing docs.
      const pmLabel     = PM_LABELS[cfg.pmTool]     || cfg.pmTool;
      const notifLabel  = N_LABELS[cfg.notificationTool] || cfg.notificationTool;
      const gaps        = detectCredGaps(cfg);
      const projName    = cfg.project.name || path.basename(cfg.repoRoot);

      if (gaps.length > 0) {
        ctx.send(
          `Evyasys — **${projName}** | PM: ${pmLabel} | Notifications: ${notifLabel}\n\n` +
          `⚠️  Credentials missing for the configured tools:\n` +
          gaps.map(g => `  • ${g}`).join('\n') + '\n\n' +
          `Run \`/evyasys:Setup\` to enter the missing credentials (saved encrypted, per-machine).`
        );
      } else if (!cfg.hasDocs) {
        ctx.send(
          `Evyasys — **${projName}** | PM: ${pmLabel} | Notifications: ${notifLabel}\n\n` +
          `📚 Quality-gate documents not generated yet.\n` +
          `Run \`/evyasys:TrainDocs\` to scan your codebase and generate the 25 docs that all delivery commands depend on.`
        );
      } else {
        // Everything is ready — normal status line.
        const mode = cfg.dryRun ? 'dry-run' : 'live';
        ctx.send(
          `Evyasys ready — **${projName}** | PM: ${pmLabel} | Notifications: ${notifLabel} | Mode: ${mode}`
        );
      }
    }
  }

  // ── Context loading (runs regardless of config state) ────────────────────────
  // Plugin layer (defaults)
  const pluginRules        = readDir(path.join(cfg.pluginRoot, '.ai', 'rules'));
  const pluginIntegrations = readDir(path.join(cfg.pluginRoot, '.ai', 'integrations'));
  const pluginWorkflows    = readDir(path.join(cfg.pluginRoot, '.ai', 'workflows'));
  const pluginMemoryPath   = path.join(cfg.pluginRoot, '.ai', 'memory', 'evyaflow.json');
  const pluginMemory       = fs.existsSync(pluginMemoryPath) ? fs.readFileSync(pluginMemoryPath, 'utf8') : '{}';

  // Project overlay — safe even when directories don't exist (readDir returns {})
  const projectDir      = path.join(cfg.repoRoot, '.evyasys');
  const projectRules    = readDir(path.join(projectDir, 'rules'));
  const projectWorkflows = readDir(path.join(projectDir, 'workflows'));
  const projectInputs   = readDir(path.join(projectDir, 'inputs'));
  const projectMemory   = readDir(path.join(projectDir, 'memory'));

  // Repo scan summary (best effort)
  let repoScan = '';
  try {
    const py = spawnSync('python', [path.join(cfg.pluginRoot, 'scripts', 'repo_scan.py'), '--summary'], {
      cwd: cfg.repoRoot, timeout: 15000, encoding: 'utf8',
      env: { PATH: process.env.PATH },
    });
    repoScan = py.stdout || py.stderr || '';
  } catch (e) {
    repoScan = `(repo_scan unavailable: ${e.message})`;
  }

  const context = {
    'evyasys.mode':             cfg.dryRun ? 'dry-run' : 'live',
    'evyasys.project':          cfg.project,
    'evyasys.pmTool':           cfg.pmTool,
    'evyasys.notificationTool': cfg.notificationTool,
    'evyasys.isConfigured':     cfg.isConfigured,
    'evyasys.hasDocs':          cfg.hasDocs,
    'evyasys.rules.plugin':     pluginRules,
    'evyasys.rules.project':    projectRules,
    'evyasys.integrations':     pluginIntegrations,
    'evyasys.workflows.plugin': pluginWorkflows,
    'evyasys.workflows.project': projectWorkflows,
    'evyasys.memory.plugin':    pluginMemory,
    'evyasys.memory.project':   projectMemory,
    'evyasys.inputs':           projectInputs,
    'evyasys.repoScan':         repoScan,
  };

  if (typeof ctx.injectContext === 'function') await ctx.injectContext(context);
  else if (ctx.context) Object.assign(ctx.context, context);
};

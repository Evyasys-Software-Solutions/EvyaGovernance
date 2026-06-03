/**
 * Post-agent hook for evyasys-update.
 *
 * 1. Checks for the <!-- EVYAUPDATE confirmed --> marker in agent output.
 * 2. Clears plugin cache directories (cache/EvyaGovernance, marketplaces/EvyaGovernance).
 * 3. Removes the evyasys plugin entry from all Claude Code settings files so no
 *    manual /plugin uninstall is needed.
 * 4. Git-clones the latest source to the marketplaces directory automatically —
 *    so the user never needs to run /plugin marketplace add.
 * 5. Shows the reinstall commands (2 if the clone succeeded, 3 if it failed).
 *
 * Project config (.evyasys/project.yaml) and credentials (~/.evyasys/credentials)
 * are never touched.
 */
const fs                   = require('fs');
const path                 = require('path');
const os                   = require('os');
const { execFileSync }     = require('child_process');

const REPO_URL = 'https://github.com/Evyasys-Software-Solutions/EvyaGovernance.git';

module.exports = async function (ctx) {
  const output = ctx.agentResult || '';

  if (!output.includes('<!-- EVYAUPDATE confirmed -->')) {
    ctx.send('Update cancelled — nothing was changed.');
    return;
  }

  // ── 1. Clear plugin cache directories ──────────────────────────────────────
  const pluginsDir = path.join(os.homedir(), '.claude', 'plugins');
  const cacheDirs  = [
    path.join(pluginsDir, 'cache', 'EvyaGovernance'),
    path.join(pluginsDir, 'marketplaces', 'EvyaGovernance'),
  ];
  const cleared = [];
  const skipped = [];

  for (const full of cacheDirs) {
    if (!fs.existsSync(full)) { skipped.push(full); continue; }
    try {
      fs.rmSync(full, { recursive: true, force: true });
      cleared.push(full);
    } catch (err) {
      ctx.send(`⚠️  Could not clear ${full}: ${err.message}`);
    }
  }

  // ── 2. Remove evyasys entry from all settings files ────────────────────────
  const settingsFiles = [
    path.join(os.homedir(), '.claude', 'settings.json'),
    path.join(process.cwd(), '.claude', 'settings.json'),
    path.join(process.cwd(), '.claude', 'settings.local.json'),
  ];

  function removeFromSettings(filePath) {
    if (!fs.existsSync(filePath)) return false;
    try {
      const raw  = fs.readFileSync(filePath, 'utf8');
      const obj  = JSON.parse(raw);
      let changed = false;

      // Format: { plugins: { "evyasys": {...} } or { "evyasys@EvyaGovernance": {...} } }
      if (obj.plugins && typeof obj.plugins === 'object') {
        for (const key of Object.keys(obj.plugins)) {
          if (key.startsWith('evyasys')) { delete obj.plugins[key]; changed = true; }
        }
        if (changed && Object.keys(obj.plugins).length === 0) delete obj.plugins;
      }

      // Format: { enabledPlugins / installedPlugins / disabledPlugins: [...] }
      for (const field of ['enabledPlugins', 'installedPlugins', 'disabledPlugins']) {
        if (Array.isArray(obj[field])) {
          const before = obj[field].length;
          obj[field] = obj[field].filter(p =>
            !(typeof p === 'string' ? p : (p.name || '')).startsWith('evyasys')
          );
          if (obj[field].length !== before) changed = true;
          if (obj[field].length === 0) delete obj[field];
        }
      }

      if (changed) {
        fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
        return true;
      }
    } catch (_) { /* skip unreadable or non-JSON files silently */ }
    return false;
  }

  const cleanedSettings = settingsFiles.filter(removeFromSettings);

  // ── 3. Report cleanup ───────────────────────────────────────────────────────
  if (cleared.length > 0)
    ctx.send('Cleared:\n' + cleared.map(p => `  • ${p}`).join('\n'));
  if (skipped.length > 0)
    ctx.send('Already clean:\n' + skipped.map(p => `  • ${p}`).join('\n'));
  if (cleanedSettings.length > 0)
    ctx.send('Removed plugin entry from settings:\n' + cleanedSettings.map(p => `  • ${p}`).join('\n'));

  // ── 4. Clone latest source to marketplaces directory ───────────────────────
  // This replaces the manual "/plugin marketplace add" step — the directory
  // just needs to exist for "/plugin install evyasys@EvyaGovernance" to work.
  const marketplacesDir = path.join(pluginsDir, 'marketplaces');
  const marketplaceDir  = path.join(marketplacesDir, 'EvyaGovernance');

  let cloneOk = false;
  try {
    fs.mkdirSync(marketplacesDir, { recursive: true });
    // execFileSync bypasses the shell entirely — no quoting needed, works on
    // Windows (any username/path), macOS, and Linux without modification.
    execFileSync('git', ['clone', '--depth', '1', REPO_URL, marketplaceDir], {
      stdio: 'pipe',
      timeout: 60_000,
    });
    cloneOk = true;
    ctx.send(`Cloned latest plugin source → ${marketplaceDir}`);
  } catch (err) {
    const detail = ((err.stderr || err.message || '').toString()).slice(0, 300);
    ctx.send(
      `⚠️  Auto-clone failed — git may not be in your PATH or the network is unavailable.\n` +
      `Detail: ${detail}\n\n` +
      `You will need to run "/plugin marketplace add ${REPO_URL}" manually (step 2 of 3 below).`
    );
  }

  // ── 5. Show reinstall steps ─────────────────────────────────────────────────
  if (cloneOk) {
    ctx.send(
      '✅ **Fully cleaned and updated. Run these two commands inside Claude Code — in order:**\n\n' +
      '**1 of 2 — Refresh plugin state**\n' +
      '```\n' +
      '/reload-plugins\n' +
      '```\n\n' +
      '**2 of 2 — Install the latest version**\n' +
      '```\n' +
      '/plugin install evyasys@EvyaGovernance\n' +
      '```\n\n' +
      'When prompted, choose **Install for you (user scope)**.\n\n' +
      'Then **fully quit Claude Code and reopen it** — all 11 commands will appear.\n\n' +
      '> Your project config and credentials were not changed.'
    );
  } else {
    ctx.send(
      '✅ **Cache cleaned. Run these three commands inside Claude Code — in order:**\n\n' +
      '**1 of 3 — Refresh plugin state**\n' +
      '```\n' +
      '/reload-plugins\n' +
      '```\n\n' +
      '**2 of 3 — Re-register the source**\n' +
      '```\n' +
      `/plugin marketplace add ${REPO_URL}\n` +
      '```\n\n' +
      '**3 of 3 — Install the latest version**\n' +
      '```\n' +
      '/plugin install evyasys@EvyaGovernance\n' +
      '```\n\n' +
      'When prompted, choose **Install for you (user scope)**.\n\n' +
      'Then **fully quit Claude Code and reopen it** — all 11 commands will appear.\n\n' +
      '> Your project config and credentials were not changed.'
    );
  }
};

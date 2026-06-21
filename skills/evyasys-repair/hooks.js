/**
 * Post-agent hook for evyasys-repair.
 *
 * Full clean reinstall for broken Evyasys plugin installations.
 *
 * 1. Checks for the <!-- EVYAREPAIR confirmed --> marker.
 * 2. Clears plugin cache and marketplaces directories completely.
 * 3. Removes the evyasys plugin entry from all Claude Code settings files.
 * 4. Shows the 4 commands needed to do a clean reinstall from scratch.
 *
 * Project config (.evyasys/project.yaml) and credentials (~/.evyasys/credentials)
 * are never touched. Only plugin code directories are removed.
 *
 * For a normal version update (not broken), use /evyasys:Update instead —
 * it uses Claude Code's built-in /plugin update and touches nothing on disk.
 */
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const REPO_URL = 'https://github.com/Evyasys-Software-Solutions/EvyaGovernance.git';

module.exports = async function (ctx) {
  const output = ctx.agentResult || '';

  if (!output.includes('<!-- EVYAREPAIR confirmed -->')) {
    ctx.send('Repair cancelled — nothing was changed.');
    return;
  }

  ctx.send('Clearing plugin cache and marketplace directories…');

  // ── 1. Clear plugin cache and marketplaces directories ─────────────────────
  const pluginsDir = path.join(os.homedir(), '.claude', 'plugins');
  const clearDirs  = [
    path.join(pluginsDir, 'cache', 'EvyaGovernance'),
    path.join(pluginsDir, 'marketplaces', 'EvyaGovernance'),
  ];

  for (const dir of clearDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      ctx.send(`⚠️  Could not clear ${dir}: ${e.message}`);
    }
  }

  // ── 2. Remove evyasys entry from all Claude Code settings files ─────────────
  const settingsFiles = [
    path.join(os.homedir(), '.claude', 'settings.json'),
    path.join(process.cwd(), '.claude', 'settings.json'),
    path.join(process.cwd(), '.claude', 'settings.local.json'),
  ];

  for (const filePath of settingsFiles) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const obj   = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      let changed = false;

      if (obj.plugins && typeof obj.plugins === 'object') {
        for (const k of Object.keys(obj.plugins)) {
          if (k.startsWith('evyasys')) { delete obj.plugins[k]; changed = true; }
        }
        if (changed && Object.keys(obj.plugins).length === 0) delete obj.plugins;
      }
      for (const field of ['enabledPlugins', 'installedPlugins', 'disabledPlugins']) {
        if (Array.isArray(obj[field])) {
          const before = obj[field].length;
          obj[field]   = obj[field].filter(
            p => !(typeof p === 'string' ? p : (p.name || '')).startsWith('evyasys')
          );
          if (obj[field].length !== before) changed = true;
          if (obj[field].length === 0) delete obj[field];
        }
      }
      if (changed) fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
    } catch { /* skip unreadable or non-JSON files silently */ }
  }

  // ── 3. Show the four commands needed to complete the reinstall ──────────────
  ctx.send(
    '✅ **Cache cleared. Complete the reinstall with these 4 commands inside Claude Code — run them in order:**\n\n' +

    '**Step 1 — Reload plugin state**\n' +
    '```\n/reload-plugins\n```\n\n' +

    '**Step 2 — Re-register the source**\n' +
    '```\n' + `/plugin marketplace add ${REPO_URL}` + '\n```\n\n' +

    '**Step 3 — Install the plugin**\n' +
    '```\n/plugin install evyasys@EvyaGovernance\n```\n' +
    'When prompted, choose **Install for you (user scope)**.\n\n' +

    '**Step 4 — Fully quit Claude Code and reopen it.**\n\n' +

    '> Your `.evyasys/` docs, board artefacts, `project.yaml`, credentials, and\n' +
    '> compression preferences (`~/.evyasys/settings.json`) were not changed.\n' +
    '> Run `/evyasys:Update` to manage compression after reinstalling.'
  );
};

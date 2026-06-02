/**
 * Post-agent hook for evyasys-update.
 *
 * 1. Checks for the <!-- EVYAUPDATE confirmed --> marker in agent output.
 * 2. Clears the two plugin cache directories using Node fs (cross-platform, no shell needed).
 * 3. Shows the three reinstall commands the user must run inside Claude Code.
 *
 * Project config (.evyasys/project.yaml) and credentials (~/.evyasys/credentials)
 * are never touched.
 */
const fs   = require('fs');
const path = require('path');
const os   = require('os');

module.exports = async function (ctx) {
  const output = ctx.agentResult || '';

  if (!output.includes('<!-- EVYAUPDATE confirmed -->')) {
    ctx.send('Update cancelled — cache was not cleared.');
    return;
  }

  const pluginsDir = path.join(os.homedir(), '.claude', 'plugins');
  const targets    = ['marketplaces', 'evyasys'];
  const cleared    = [];
  const skipped    = [];

  for (const dir of targets) {
    const full = path.join(pluginsDir, dir);
    if (!fs.existsSync(full)) {
      skipped.push(full);
      continue;
    }
    try {
      fs.rmSync(full, { recursive: true, force: true });
      cleared.push(full);
    } catch (err) {
      ctx.send(`⚠️  Could not clear ${full}: ${err.message}\nTry closing Claude Code and running the command again.`);
    }
  }

  if (cleared.length > 0) {
    ctx.send('Cleared:\n' + cleared.map(p => `  • ${p}`).join('\n'));
  }
  if (skipped.length > 0) {
    ctx.send('Already clean (nothing to remove):\n' + skipped.map(p => `  • ${p}`).join('\n'));
  }

  ctx.send(
    '✅ **Cache cleared. Now run these three commands inside Claude Code — in order:**\n\n' +
    '**1 of 3 — Re-register the plugin source**\n' +
    '```\n' +
    '/plugin marketplace add https://github.com/Evyasys-Software-Solutions/EvyaGovernance.git\n' +
    '```\n\n' +
    '**2 of 3 — Re-install the plugin**\n' +
    '```\n' +
    '/plugin install evyasys@EvyaGovernance\n' +
    '```\n\n' +
    '**3 of 3 — Reload so the updated commands appear**\n' +
    '```\n' +
    '/reload-plugins\n' +
    '```\n\n' +
    '> Wait for each command to complete before running the next.\n' +
    '> Your project config and credentials were not changed.'
  );
};

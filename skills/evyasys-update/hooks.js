/**
 * Post-agent hook for evyasys-update.
 *
 * 1. Checks for the <!-- EVYAUPDATE confirmed --> marker.
 * 2. Reads the current installed version from this plugin's own plugin.json.
 * 3. Fetches the latest version + changelog from GitHub (small JSON/text fetch —
 *    no clone, no file deletions).
 * 4. Shows version diff and what's new.
 * 5. Shows the 3 built-in Claude Code commands needed to complete the update.
 *
 * Nothing is deleted — Claude Code's /plugin update owns the install cleanly.
 * Project config (.evyasys/project.yaml) and credentials (~/.evyasys/credentials)
 * are never touched.
 *
 * For a broken install that needs full teardown, /evyasys:Repair handles that.
 */
const fs    = require('fs');
const path  = require('path');
const https = require('https');

const RAW_BASE    = 'https://raw.githubusercontent.com/Evyasys-Software-Solutions/EvyaGovernance/main';
const PLUGIN_ROOT = path.resolve(__dirname, '..', '..');

// ── Helpers ───────────────────────────────────────────────────────────────────

function readLocalVersion() {
  try {
    const raw = fs.readFileSync(
      path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'), 'utf8'
    );
    return JSON.parse(raw).version || '?';
  } catch { return '?'; }
}

function fetchText(url, timeoutMs = 6000) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return resolve(null); }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
    });
    req.on('error',   () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

/**
 * Extract changelog sections newer than `fromVersion`.
 * Shows up to 3 release sections, each capped at 35 lines.
 */
function parseChangelog(text, fromVersion) {
  if (!text) return null;
  const sections = text.split(/\n(?=## \[)/);
  const out = [];
  for (const section of sections) {
    const m = section.match(/^## \[([^\]]+)\]/);
    if (!m) continue;
    if (m[1] === fromVersion) break;
    out.push(section.split('\n').slice(0, 35).join('\n').trimEnd());
    if (out.length >= 3) break;
  }
  return out.length > 0 ? out.join('\n\n') : null;
}

// ── Main hook ─────────────────────────────────────────────────────────────────

module.exports = async function (ctx) {
  const output = ctx.agentResult || '';

  if (!output.includes('<!-- EVYAUPDATE confirmed -->')) {
    ctx.send('Update cancelled — nothing was changed.');
    return;
  }

  const currentVersion = readLocalVersion();
  ctx.send(`Current version: **v${currentVersion}**`);

  ctx.send('Checking latest version on GitHub…');

  const [remotePluginRaw, changelogRaw] = await Promise.all([
    fetchText(`${RAW_BASE}/.claude-plugin/plugin.json`),
    fetchText(`${RAW_BASE}/CHANGELOG.md`),
  ]);

  let latestVersion = null;
  if (remotePluginRaw) {
    try { latestVersion = JSON.parse(remotePluginRaw).version || null; } catch { /* */ }
  }

  if (latestVersion) {
    if (latestVersion === currentVersion) {
      ctx.send(`✅ You are already on the latest version (v${latestVersion}).`);
    } else {
      ctx.send(`📦 **v${currentVersion} → v${latestVersion}**`);
    }
    const highlights = parseChangelog(changelogRaw, currentVersion);
    if (highlights) ctx.send(`**What's new:**\n\n${highlights}`);
  } else {
    ctx.send('⚠️  Could not reach GitHub to check the latest version — run the commands below anyway to pull the latest.');
  }

  ctx.send(
    '✅ **Run these commands inside Claude Code — in order:**\n\n' +

    '**Step 1 — Refresh the marketplace source**\n' +
    '```\n/plugin marketplace update EvyaGovernance\n```\n\n' +

    '**Step 2 — Install the latest version**\n' +
    '```\n/plugin update evyasys@EvyaGovernance\n```\n\n' +

    '**Step 3 — Reload plugin state**\n' +
    '```\n/reload-plugins\n```\n\n' +

    '**Step 4 — Fully quit Claude Code and reopen it.**\n\n' +

    '> Your `.evyasys/` docs, board artefacts, `project.yaml`, and credentials were not changed.\n' +
    '> If commands are still missing after this, run `/evyasys:Repair` for a full clean reinstall.'
  );
};

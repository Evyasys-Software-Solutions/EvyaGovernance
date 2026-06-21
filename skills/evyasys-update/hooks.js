/**
 * Post-agent hook for evyasys-update.
 *
 * 1. Checks for the <!-- EVYAUPDATE confirmed --> marker.
 * 2. Reads the current installed version from this plugin's own plugin.json.
 * 3. Fetches the latest version + changelog from GitHub (small JSON/text fetch).
 * 4. Shows version diff and what's new from the changelog.
 * 5. Handles context compression based on <!-- EVYACOMPRESS --> marker:
 *      update  → upgrade headroom-ai[mcp] to latest, update ~/.evyasys/settings.json
 *      disable → mark disabled in ~/.evyasys/settings.json
 *      skip    → leave compression state unchanged
 * 6. Shows the 3 commands to complete the plugin update.
 *
 * Nothing is deleted from the plugin dirs — /plugin update owns that cleanly.
 * Project config (.evyasys/project.yaml) and credentials (~/.evyasys/credentials)
 * are never touched. ~/.evyasys/settings.json is only written when the user
 * explicitly chose update or disable in Step 2 of the Update command.
 */
const fs    = require('fs');
const path  = require('path');
const https = require('https');

const { updateCompress, disableCompress } = require('../../scripts/lib/ensure-compress');

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

  // ── 1. Plugin version check ─────────────────────────────────────────────────
  const currentVersion = readLocalVersion();
  ctx.send(`Current plugin version: **v${currentVersion}**`);
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
      ctx.send(`✅ Already on the latest plugin version (v${latestVersion}).`);
    } else {
      ctx.send(`📦 **v${currentVersion} → v${latestVersion}**`);
    }
    const highlights = parseChangelog(changelogRaw, currentVersion);
    if (highlights) ctx.send(`**What's new:**\n\n${highlights}`);
  } else {
    ctx.send('⚠️  Could not reach GitHub to check the latest version — run the commands below to pull the latest.');
  }

  // ── 2. Compression — act on user's explicit choice ──────────────────────────
  const compressMarker = output.includes('<!-- EVYACOMPRESS update -->')  ? 'update'
                       : output.includes('<!-- EVYACOMPRESS disable -->') ? 'disable'
                       : 'skip';

  if (compressMarker === 'update') {
    ctx.send('Updating context compression engine…');
    const result = updateCompress();
    if (result.success) {
      const versionNote = result.previousVersion && result.version && result.previousVersion !== result.version
        ? ` (v${result.previousVersion} → v${result.version})`
        : result.version ? ` (v${result.version})` : '';
      ctx.send(
        `✅ Compression engine updated${versionNote}.\n` +
        '> Restart Claude Code once for the update to activate.'
      );
    } else {
      ctx.send(
        '⚠️  Compression engine update failed — Python or pip may not be available.\n' +
        '> Install Python 3.8+ and run `/evyasys:Update` again to retry.'
      );
    }
  } else if (compressMarker === 'disable') {
    disableCompress();
    ctx.send('Context compression disabled. Preference saved to `~/.evyasys/settings.json`.');
  }
  // 'skip' → leave compression state unchanged, show nothing.

  // ── 3. Plugin update commands ───────────────────────────────────────────────
  ctx.send(
    '✅ **Run these commands inside Claude Code — in order:**\n\n' +

    '**Step 1 — Refresh the marketplace source**\n' +
    '```\n/plugin marketplace update EvyaGovernance\n```\n\n' +

    '**Step 2 — Install the latest version**\n' +
    '```\n/plugin update evyasys@EvyaGovernance\n```\n\n' +

    '**Step 3 — Reload plugin state**\n' +
    '```\n/reload-plugins\n```\n\n' +

    '**Step 4 — Fully quit Claude Code and reopen it.**\n\n' +

    '> Your `.evyasys/` docs, board artefacts, `project.yaml`, credentials, and\n' +
    '> compression preferences (`~/.evyasys/settings.json`) were not changed.\n' +
    '> If commands are still missing after this, run `/evyasys:Repair`.'
  );
};

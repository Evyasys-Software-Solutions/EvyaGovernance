/**
 * Context compression — install, register, and update.
 *
 * All user-visible state is persisted in ~/.evyasys/settings.json (compress key).
 * That file is never modified by plugin updates — only by explicit user consent
 * via /evyasys:Setup (first-time) or /evyasys:Update (ongoing management).
 *
 * Exports:
 *   ensureCompress()  — first-time install (Setup hook). Fast-path skips if
 *                       already registered. Only installs with user consent.
 *   updateCompress()  — upgrade to latest version (Update hook).
 *   disableCompress() — unregister MCP and mark disabled in settings.
 *   getCompressState()— read current machine state without changing anything.
 *
 * Bypass: EVYASYS_COMPRESS=0 skips all operations silently.
 */
const { execSync }                                    = require('child_process');
const fs                                              = require('fs');
const path                                            = require('path');
const os                                              = require('os');
const { readCompressSettings, writeCompressSettings } = require('./compress-settings');

function run(cmd) {
  return execSync(cmd, { stdio: 'pipe', timeout: 120_000 }).toString().trim();
}

function isHeadroomOnPath() {
  try { run('headroom --version'); return true; } catch { return false; }
}

function getInstalledVersion() {
  try {
    const out = run('headroom --version');
    const m   = out.match(/(\d+\.\d+(?:\.\d+)*)/);
    return m ? m[1] : out.trim();
  } catch { return null; }
}

function findPip() {
  try { run('pip --version'); return 'pip'; } catch {
    try { run('pip3 --version'); return 'pip3'; } catch { return null; }
  }
}

/**
 * Check whether headroom is registered as a Claude Code MCP server.
 * Scans ~/.claude/settings.json mcpServers for any entry whose command
 * contains "headroom" — robust regardless of the key name headroom assigns.
 */
function isMcpRegistered() {
  try {
    const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
    if (!fs.existsSync(settingsPath)) return false;
    const s = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (!s.mcpServers) return false;
    return Object.values(s.mcpServers).some(
      srv => typeof srv.command === 'string' && srv.command.includes('headroom')
    );
  } catch { return false; }
}

/**
 * Returns the current machine state — no side effects.
 * @returns {{ onPath: boolean, mcpRegistered: boolean, version: string|null, settingsEnabled: boolean|null }}
 */
function getCompressState() {
  const saved = readCompressSettings();
  return {
    onPath:          isHeadroomOnPath(),
    mcpRegistered:   isMcpRegistered(),
    version:         getInstalledVersion(),
    settingsEnabled: saved ? saved.enabled : null,
    settingsVersion: saved ? (saved.version || null) : null,
  };
}

/**
 * First-time install. Called by the Setup hook when user chose "enable".
 * Fast-path: if already registered, skip pip+mcp and return immediately.
 *
 * @returns {{ registered: boolean, freshInstall: boolean, version: string|null }}
 */
function ensureCompress() {
  if (process.env.EVYASYS_COMPRESS === '0') {
    return { registered: false, freshInstall: false, version: null };
  }

  // Fast path — already installed and registered.
  if (isHeadroomOnPath() && isMcpRegistered()) {
    const version = getInstalledVersion();
    writeCompressSettings({ enabled: true, version });
    return { registered: true, freshInstall: false, version };
  }

  try {
    const pip = findPip();
    if (pip) {
      run(`${pip} install "headroom-ai[mcp]" --user --quiet`);
    } else if (!isHeadroomOnPath()) {
      return { registered: false, freshInstall: false, version: null };
    }

    run('headroom mcp install');
    const version = getInstalledVersion();
    writeCompressSettings({ enabled: true, version });
    return { registered: true, freshInstall: true, version };
  } catch {
    // mcp install may throw "already registered" — if binary is on PATH, treat as success.
    if (isHeadroomOnPath()) {
      const version = getInstalledVersion();
      writeCompressSettings({ enabled: true, version });
      return { registered: true, freshInstall: false, version };
    }
    return { registered: false, freshInstall: false, version: null };
  }
}

/**
 * Upgrade to latest version. Called by the Update hook when user chose to update.
 *
 * @returns {{ success: boolean, version: string|null, previousVersion: string|null }}
 */
function updateCompress() {
  if (process.env.EVYASYS_COMPRESS === '0') {
    return { success: false, version: null, previousVersion: null };
  }

  const previousVersion = getInstalledVersion();
  try {
    const pip = findPip();
    if (!pip && !isHeadroomOnPath()) {
      return { success: false, version: null, previousVersion };
    }
    if (pip) {
      run(`${pip} install "headroom-ai[mcp]" --user --quiet --upgrade`);
    }
    // Re-register in case MCP entry was lost.
    try { run('headroom mcp install'); } catch { /* already registered — ok */ }
    const version = getInstalledVersion();
    writeCompressSettings({ enabled: true, version });
    return { success: true, version, previousVersion };
  } catch {
    return { success: false, version: null, previousVersion };
  }
}

/**
 * Mark compression as disabled in settings. Does not uninstall the pip package
 * (that would be destructive) — just records the user's preference.
 */
function disableCompress() {
  writeCompressSettings({ enabled: false, version: getInstalledVersion() });
}

module.exports = { ensureCompress, updateCompress, disableCompress, getCompressState };

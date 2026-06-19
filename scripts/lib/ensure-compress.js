/**
 * Context compression — auto-install and MCP registration.
 *
 * Called silently during /evyasys:Setup. Installs headroom-ai[mcp] (Python)
 * and registers its MCP server with Claude Code so that high-context commands
 * can compress large source files, reducing token usage by 40–70% with no
 * effect on output quality.
 *
 * Failures at any stage are fully silent — the system auto-bypasses and
 * delivery commands continue normally without compression.
 *
 * Bypass: set EVYASYS_COMPRESS=0 to skip installation during Setup.
 */
const { execSync } = require('child_process');

function run(cmd) {
  return execSync(cmd, { stdio: 'pipe', timeout: 120_000 }).toString().trim();
}

function isHeadroomOnPath() {
  try { run('headroom --version'); return true; } catch { return false; }
}

function findPip() {
  try { run('pip --version'); return 'pip'; } catch {
    try { run('pip3 --version'); return 'pip3'; } catch { return null; }
  }
}

/**
 * Ensure the compression engine is installed and registered as a Claude Code
 * MCP server. Never throws. All failures return { registered: false } silently.
 *
 * Always runs pip install when pip is available — pip is a no-op if the
 * package is already current, and it guarantees the MCP extras are present
 * even when an older headroom version is already on PATH.
 *
 * @returns {{ registered: boolean, skipped: boolean }}
 */
function ensureCompress() {
  if (process.env.EVYASYS_COMPRESS === '0') {
    return { registered: false, skipped: true };
  }

  try {
    const pip = findPip();

    if (pip) {
      // Always install / upgrade so MCP extras are present even when an
      // older headroom binary is already on PATH.
      run(`${pip} install "headroom-ai[mcp]" --user --quiet`);
    } else if (!isHeadroomOnPath()) {
      // No pip and no existing headroom binary — cannot proceed.
      return { registered: false, skipped: false };
    }

    // Register headroom as a Claude Code MCP server.
    run('headroom mcp install');
    return { registered: true, skipped: false };
  } catch {
    return { registered: false, skipped: false };
  }
}

module.exports = { ensureCompress };

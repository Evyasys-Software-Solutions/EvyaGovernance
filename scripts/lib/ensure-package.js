/**
 * Reusable runtime package installer for Evyasys.
 *
 * Tries to require a package. If it isn't installed, runs
 * `npm install <name>` in the plugin root and requires it again.
 *
 * Usage:
 *   const pdfkit = ensurePackage('pdfkit', msg => ctx.send(msg));
 *
 * @param {string}            name   npm package name
 * @param {function|null}     log    optional status callback (receives a string).
 *                                   Falls back to console.log if omitted.
 * @returns {*}  the loaded module
 * @throws  if installation fails
 */
const { execSync } = require('child_process');
const path         = require('path');

// Plugin root is two directories above scripts/lib/
const PLUGIN_ROOT = path.resolve(__dirname, '..', '..');

function ensurePackage(name, log) {
  const out = typeof log === 'function' ? log : (m) => console.log(`[evyasys] ${m}`);

  // Fast path: already available
  try { return require(name); } catch (e) {
    if (!String(e.message).startsWith('Cannot find module')) throw e;
  }

  // Package missing — attempt auto-install
  out(`📦 "${name}" is not installed. Installing automatically (takes ~10 s)...`);

  try {
    execSync(`npm install ${name} --save`, {
      cwd:     PLUGIN_ROOT,
      stdio:   'pipe',       // capture output, don't pollute the terminal
      timeout: 90_000,       // 90 s max
    });
  } catch (installErr) {
    const hint = `npm install ${name}`;
    throw new Error(
      `Could not auto-install "${name}".\n` +
      `Please run manually from your project folder:\n  ${hint}\n\n` +
      `npm error: ${(installErr.stderr || installErr.message || '').toString().slice(0, 400)}`
    );
  }

  // Re-require after install (module wasn't in cache before)
  try {
    const mod = require(name);
    out(`✅ "${name}" installed successfully.`);
    return mod;
  } catch (e2) {
    throw new Error(
      `Installed "${name}" but still cannot load it.\n` +
      `Try restarting Claude Code and running the command again.\n` +
      `Error: ${e2.message}`
    );
  }
}

module.exports = { ensurePackage, PLUGIN_ROOT };

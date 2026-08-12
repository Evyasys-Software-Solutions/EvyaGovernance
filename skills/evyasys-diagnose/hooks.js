/**
 * Post-agent hook for evyasys-diagnose.
 *
 * Diagnose is read-only. The hook does NOT write to disk, does NOT change PM
 * state, does NOT send notifications. It just:
 *   1. Parses the structured `<!-- EVYADIAGNOSE ... -->` tail block emitted
 *      by the agent alongside the human-readable report.
 *   2. Prints a compact one-liner tally.
 *   3. Records the timestamp of the last run to `.evyasys/diagnostics.json` so
 *      future commands can consult "when was I last healthy?" without re-running
 *      Diagnose.
 */
const fs   = require('fs');
const path = require('path');
const { loadConfig } = require('../../scripts/lib/config');

function parseTail(text) {
  const m = text && text.match(/<!--\s*EVYADIAGNOSE\s*([\s\S]*?)-->/);
  if (!m) return null;
  try { return JSON.parse(m[1].trim()); } catch { return null; }
}

module.exports = async function (ctx) {
  const cfg    = await loadConfig({ ctx });
  const output = ctx.agentResult || '';

  const tail = parseTail(output);
  if (!tail) {
    ctx.send('Diagnose ran. (No structured tail block found — human report above stands as-is.)');
    return;
  }

  const { checks = {}, issues = [] } = tail;
  const { pass = 0, warn = 0, fail = 0, skip = 0 } = checks;

  // Compact tally
  const verdict = fail > 0 ? '❌ needs attention' : warn > 0 ? '⚠️  mostly healthy' : '✅ all clear';
  ctx.send(
    `${verdict} — ${pass}/${pass + warn + fail + skip} passed · ${warn} warning(s) · ${fail} failure(s)` +
    (skip > 0 ? ` · ${skip} skipped` : '')
  );

  if (issues.length > 0) {
    const top = issues.slice(0, 3);
    ctx.send(
      `Top ${top.length === issues.length ? 'issue(s)' : `${top.length} of ${issues.length} issue(s)`} to address:\n` +
      top.map((it, i) => `  ${i + 1}. [${it.level}] ${it.summary} → \`${it.fix}\``).join('\n')
    );
  }

  // Record the last-run timestamp (best-effort; no atomic write needed — this
  // is trivially replayable and read-only from the plugin's perspective).
  try {
    const evyaDir = path.join(cfg.repoRoot, '.evyasys');
    if (fs.existsSync(evyaDir)) {
      const diagFile = path.join(evyaDir, 'diagnostics.json');
      let history = { runs: [] };
      if (fs.existsSync(diagFile)) {
        try { history = JSON.parse(fs.readFileSync(diagFile, 'utf8')); }
        catch { history = { runs: [] }; }
      }
      history.runs = (history.runs || []).slice(-9); // keep last 10
      history.runs.push({
        ranAt:  tail.ranAt || new Date().toISOString(),
        pluginVersion: tail.pluginVersion || 'unknown',
        pass, warn, fail, skip,
        issues: issues.map(i => ({ level: i.level, summary: i.summary })),
      });
      history.lastRunAt = history.runs[history.runs.length - 1].ranAt;
      fs.writeFileSync(diagFile, JSON.stringify(history, null, 2) + '\n', 'utf8');
    }
  } catch (err) {
    // Non-fatal — the human report is the primary output.
    ctx.send(`(Could not update .evyasys/diagnostics.json: ${err.message})`);
  }
};

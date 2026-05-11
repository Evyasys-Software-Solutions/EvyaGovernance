/**
 * Live-by-default integration runner.
 * In live mode it calls the live function and reports success/error.
 * In dry-run mode (EVYASYS_DRY_RUN=1) it logs what *would* happen.
 */
async function runIntegration({ name, cfg, args, live }) {
  if (cfg.dryRun) {
    const preview = `[evyasys:dry-run] ${name} args=${JSON.stringify(args)}`;
    // eslint-disable-next-line no-console
    console.log(preview);
    return { dryRun: true, name, args, preview };
  }
  try {
    const out = await live();
    return { dryRun: false, name, args, result: out };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[evyasys:error] ${name} failed:`, err.message || err);
    return { dryRun: false, name, args, error: String(err.message || err) };
  }
}

module.exports = { runIntegration };

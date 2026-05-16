/**
 * Post-agent hook for evyasys-review-dev.
 *
 * Saves the code review report to the story folder on BOTH GO and NO-GO verdicts.
 * A review that isn't saved on NO-GO leaves the developer with nothing to fix from —
 * always persist the findings, then decide what notification to post.
 *
 *   GO     → save review → post Teams GO card → prompt to run FinishDev.
 *   NO-GO  → save review → post Teams NO-GO card → prompt to fix and re-run.
 *   Unclear → ask user whether to save; no Teams notification, no state change.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration }             = require('../../scripts/lib/dryrun');
const { loadConfig, ensureTeamsWebhook } = require('../../scripts/lib/config');
const adoMap                         = require('../../scripts/lib/ado-map');

// Word-boundary patterns to avoid false positives ("FAILURE", "failover", etc.).
// NO-GO must be tested before GO since "GO" would otherwise match inside "NO-GO".
const RE_NO_GO = /\bNO-GO\b/i;
const RE_GO    = /(?<!\w)GO\s*✅|^#+\s*verdict[:\s]*go\b/im;

module.exports = async function (ctx) {
  const cfg     = await loadConfig({ ctx });
  const storyId = ctx.args && ctx.args[0];

  if (!storyId) { ctx.send('Missing StoryID. Usage: /evyasys:ReviewDev <StoryID>'); return; }

  const review = ctx.agentResult;
  if (!review) { ctx.send('No review report in context — aborting save.'); return; }

  const isNoGo = RE_NO_GO.test(review);
  const isGo   = !isNoGo && RE_GO.test(review);

  // ── Resolve story folder ─────────────────────────────────────────────────────
  const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
    || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);

  // ── Save review — always on GO/NO-GO; ask user only when verdict is unclear ──
  if (!isGo && !isNoGo) {
    const save = await ctx.confirm(`Verdict unclear — save this review report to ${storyDir}?`);
    if (!save) { ctx.send('Review not saved. Run /evyasys:ReviewDev again when ready.'); return; }
  }

  fs.mkdirSync(storyDir, { recursive: true });
  const reviewPath = path.join(storyDir, `${storyId}_CodeReview.md`);
  fs.writeFileSync(reviewPath, review, 'utf8');
  ctx.send(`Code review saved → ${reviewPath}`);

  // ── Unclear verdict: saved, nothing else to do ───────────────────────────────
  if (!isGo && !isNoGo) {
    ctx.send('Review saved. Verdict was unclear — confirm the outcome manually if needed.');
    return;
  }

  await ensureTeamsWebhook(cfg, ctx);

  // ── NO-GO: notify team, stop — do not advance ADO state ─────────────────────
  if (isNoGo) {
    await runIntegration({
      name: 'teams:review-no-go', cfg,
      args: { storyId },
      live: async () => require('../../scripts/integrations/teams_webhook').reviewNoGo({ storyId }),
    });
    ctx.send(`Review verdict: NO-GO ❌ — fix all Critical items and run /evyasys:ReviewDev ${storyId} again.`);
    return;
  }

  // ── GO: post Teams card ──────────────────────────────────────────────────────
  await runIntegration({
    name: 'teams:review-passed', cfg,
    args: { storyId },
    live: async () => require('../../scripts/integrations/teams_webhook').reviewPassed({ storyId }),
  });

  ctx.send(`Review passed ✅ — proceed with /evyasys:FinishDev ${storyId}`);
};

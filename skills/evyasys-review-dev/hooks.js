/**
 * Post-agent hook for evyasys-review-dev.
 *
 * Saves the code review report to the story folder on BOTH GO and NO-GO verdicts.
 * A review that isn't saved on NO-GO leaves the developer with nothing to fix from —
 * always persist the findings, then decide what notification to post.
 *
 *   GO     → save review → send GO notification → prompt to run FinishDev.
 *   NO-GO  → save review → send NO-GO notification → prompt to fix and re-run.
 *   Unclear → ask user whether to save; no notification, no state change.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration }  = require('../../scripts/lib/dryrun');
const { loadConfig }      = require('../../scripts/lib/config');
const adoMap              = require('../../scripts/lib/ado-map');
const notify              = require('../../scripts/lib/notify-adapter');

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

  // Resolve story folder.
  const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
    || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);

  // Save on GO/NO-GO; ask user only when verdict is unclear.
  if (!isGo && !isNoGo) {
    const save = await ctx.confirm(`Verdict unclear — save this review report to ${storyDir}?`);
    if (!save) { ctx.send('Review not saved. Run /evyasys:ReviewDev again when ready.'); return; }
  }

  fs.mkdirSync(storyDir, { recursive: true });
  const reviewPath = path.join(storyDir, `${storyId}_CodeReview.md`);
  fs.writeFileSync(reviewPath, review, 'utf8');
  ctx.send(`Code review saved → ${reviewPath}`);

  if (!isGo && !isNoGo) {
    ctx.send('Review saved. Verdict was unclear — confirm the outcome manually if needed.');
    return;
  }

  await notify.ensureCredentials(cfg);

  if (isNoGo) {
    await runIntegration({
      name: `${cfg.notificationTool}:review-no-go`, cfg,
      args: { storyId },
      live: () => notify.send(cfg, { event: 'review-no-go', storyId }),
    });
    ctx.send(`Review verdict: NO-GO ❌ — fix all Critical items and run /evyasys:ReviewDev ${storyId} again.`);
    return;
  }

  await runIntegration({
    name: `${cfg.notificationTool}:review-passed`, cfg,
    args: { storyId },
    live: () => notify.send(cfg, { event: 'review-passed', storyId }),
  });

  ctx.send(`Review passed ✅ — proceed with /evyasys:FinishDev ${storyId}`);
};

const path = require('path');
const fs   = require('fs');
const { runIntegration }             = require('../../scripts/lib/dryrun');
const { loadConfig, ensureTeamsWebhook } = require('../../scripts/lib/config');
const adoMap                         = require('../../scripts/lib/ado-map');

module.exports = async function (ctx) {
  const cfg     = await loadConfig({ ctx });
  const storyId = ctx.args && ctx.args[0];

  if (!storyId) { ctx.send('Missing StoryID. Usage: /evyasys:ReviewDev <StoryID>'); return; }
  const review = ctx.agentResult;
  if (!review) { ctx.send('No review report in context — aborting save.'); return; }

  const isNoGo = /NO-GO\s*❌|verdict.*NO.GO|FAIL/i.test(review);
  const isGo   = !isNoGo && /GO\s*✅|verdict.*\bGO\b|PASS/i.test(review);

  if (isNoGo) {
    ctx.send(`Review verdict: NO-GO ❌ — fix Critical items and run /evyasys:ReviewDev ${storyId} again.`);
    return;
  }

  const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
    || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);

  if (!isGo) {
    const save = await ctx.confirm(`Save this review report to ${storyDir}?`);
    if (!save) { ctx.send('Review not saved. Run /evyasys:ReviewDev again when ready.'); return; }
  }

  fs.mkdirSync(storyDir, { recursive: true });
  const reviewPath = path.join(storyDir, `${storyId}_CodeReview.md`);
  fs.writeFileSync(reviewPath, review, 'utf8');
  ctx.send(`Code review saved → ${reviewPath}`);

  await ensureTeamsWebhook(cfg, ctx);
  await runIntegration({
    name: 'teams:review-passed', cfg,
    args: { storyId },
    live: async () => require('../../scripts/integrations/teams_webhook').reviewPassed({ storyId }),
  });

  ctx.send(`Review passed ✅ — proceed with /evyasys:FinishDev ${storyId}`);
};

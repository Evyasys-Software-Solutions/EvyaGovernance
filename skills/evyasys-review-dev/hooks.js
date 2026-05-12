/**
 * Post-agent hook for evyasys-review-dev.
 * Saves the code review report to docs/stories/<id>_CodeReview.md on GO verdict.
 * No ADO state transition — FinishDev handles that after review passes.
 */
const path = require('path');
const fs   = require('fs');
const { loadConfig } = require('../../scripts/lib/config');

module.exports = async function (ctx) {
  const cfg     = await loadConfig({ ctx });
  const storyId = ctx.args && ctx.args[0];

  if (!storyId) {
    ctx.send('Missing StoryID. Usage: /evyasys:ReviewDev <StoryID>');
    return;
  }

  const review = ctx.agentResult;
  if (!review) {
    ctx.send('No review report in context — aborting save.');
    return;
  }

  // Only save if the review contains a GO verdict
  const isGo = /GO\s*✅|verdict.*GO|PASS/i.test(review);
  const isNoGo = /NO-GO\s*❌|verdict.*NO.GO|FAIL/i.test(review);

  if (isNoGo) {
    ctx.send(`Review verdict: NO-GO ❌ — fix Critical items and run /evyasys:ReviewDev ${storyId} again.`);
    return;
  }

  if (!isGo) {
    const save = await ctx.confirm('Save this review report to docs/stories/?');
    if (!save) {
      ctx.send('Review not saved. Run /evyasys:ReviewDev again when ready.');
      return;
    }
  }

  const storiesDir = path.join(cfg.repoRoot, 'docs', 'stories');
  fs.mkdirSync(storiesDir, { recursive: true });
  const reviewPath = path.join(storiesDir, `${storyId}_CodeReview.md`);
  fs.writeFileSync(reviewPath, review, 'utf8');
  ctx.send(`Code review saved → ${reviewPath}`);
  ctx.send(`Review passed ✅ — proceed with /evyasys:FinishDev ${storyId}`);
};

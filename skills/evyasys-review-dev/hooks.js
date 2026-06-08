/**
 * Post-agent hook for evyasys-review-dev.
 *
 * Saves the code review report to the story folder on BOTH GO and NO-GO verdicts.
 * A review that isn't saved on NO-GO leaves the developer with nothing to fix from —
 * always persist the findings, then decide what notification to post.
 *
 * Batch mode (EVYAREVIEWDEVBATCH manifest present):
 *   Accepts epic IDs or multiple story IDs. No single confirmation gate — each review
 *   is processed immediately as it is found in the output.
 *   Verdict comes from manifest: "GO" | "NO-GO" | "UNCLEAR"
 *   For each story: save review → notify immediately (review-passed or review-no-go).
 *   UNCLEAR stories: saved with a warning, no notification sent.
 *
 * Single-story fallback (no manifest):
 *   Original behaviour — regex verdict detection on full ctx.agentResult.
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

const RE_NO_GO = /\bNO-GO\b/i;
const RE_GO    = /(?<!\w)GO\s*✅|^#+\s*verdict[:\s]*go\b/im;

function parseBatchManifest(text, tag) {
  const m = text && text.match(new RegExp(`<!--\\s*${tag}\\s*([\\s\\S]*?)-->`, 'i'));
  if (!m) return null;
  try { return JSON.parse(m[1].trim()); } catch { return null; }
}

function parseContentBlocks(text, tag) {
  const out     = {};
  const startRe = new RegExp(`=== ${tag}: ([\\w-]+) ===`, 'g');
  let sm;
  while ((sm = startRe.exec(text)) !== null) {
    const id     = sm[1];
    const after  = text.slice(sm.index + sm[0].length);
    const endTag = `=== END_${tag}: ${id} ===`;
    const endIdx = after.indexOf('\n' + endTag);
    if (endIdx !== -1) out[id] = after.slice(1, endIdx);
  }
  return out;
}

module.exports = async function (ctx) {
  const cfg    = await loadConfig({ ctx });
  const output = ctx.agentResult || '';

  // ── Batch mode ─────────────────────────────────────────────────────────────────
  const batch = parseBatchManifest(output, 'EVYAREVIEWDEVBATCH');

  if (batch && Array.isArray(batch.stories) && batch.stories.length > 0) {
    const blocks    = parseContentBlocks(output, 'EVYA_CODEREVIEW');
    const hasNotify = cfg.notificationTool !== 'none';

    if (hasNotify) await notify.ensureCredentials(cfg);

    for (const story of batch.stories) {
      const { storyId, verdict } = story;
      const review = blocks[storyId];

      if (!review) {
        ctx.send(`⚠️  Code review block for ${storyId} not found in agent output — skipped.`);
        continue;
      }

      const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
        || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
      fs.mkdirSync(storyDir, { recursive: true });
      const reviewPath = path.join(storyDir, `${storyId}_CodeReview.md`);
      fs.writeFileSync(reviewPath, review, 'utf8');
      ctx.send(`Code review saved → ${reviewPath}`);

      const v = String(verdict || '').toUpperCase();

      if (v === 'UNCLEAR') {
        ctx.send(`${storyId} — verdict UNCLEAR. Review saved. Confirm outcome manually if needed.`);
        continue;
      }

      if (v === 'NO-GO') {
        if (hasNotify) {
          await runIntegration({
            name: `${cfg.notificationTool}:review-no-go`, cfg,
            args: { storyId },
            live: () => notify.send(cfg, { event: 'review-no-go', storyId }),
          });
        }
        ctx.send(`${storyId} — Review verdict: NO-GO ❌ — fix all Critical items and run /evyasys:ReviewDev ${storyId} again.`);
        continue;
      }

      // GO
      if (hasNotify) {
        await runIntegration({
          name: `${cfg.notificationTool}:review-passed`, cfg,
          args: { storyId },
          live: () => notify.send(cfg, { event: 'review-passed', storyId }),
        });
      }
      ctx.send(`${storyId} — Review passed ✅ — proceed with /evyasys:FinishDev ${storyId}`);
    }
    return;
  }

  // ── Single-story fallback (original behaviour) ─────────────────────────────────
  const storyId = ctx.args && ctx.args[0];
  if (!storyId) {
    ctx.send('Missing StoryID. Usage: /evyasys:ReviewDev <StoryID|EpicID> [...]');
    return;
  }

  const review = output;
  if (!review) { ctx.send('No review report in context — aborting save.'); return; }

  const isNoGo = RE_NO_GO.test(review);
  const isGo   = !isNoGo && RE_GO.test(review);

  const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
    || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);

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

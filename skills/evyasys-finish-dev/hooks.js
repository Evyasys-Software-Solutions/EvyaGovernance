/**
 * Post-agent hook for evyasys-finish-dev.
 *
 * Batch mode (EVYAFINISHDEVBATCH manifest present):
 *   Accepts epic IDs or multiple story IDs. Single confirmation gate covers all.
 *   For each story: save dev summary → PM "Ready for QA" → notify dev-finished immediately.
 *
 * Single-story fallback (no manifest):
 *   Original behaviour — ctx.args[0] as storyId, ctx.agentResult as dev summary.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration } = require('../../scripts/lib/dryrun');
const { loadConfig }     = require('../../scripts/lib/config');
const adoMap             = require('../../scripts/lib/ado-map');
const pm                 = require('../../scripts/lib/pm-adapter');
const notify             = require('../../scripts/lib/notify-adapter');

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

  const pmLabel     = pm.toolLabel(cfg);
  const notifyLabel = notify.toolLabel(cfg);
  const hasNotify   = cfg.notificationTool !== 'none';
  const notifyPart  = hasNotify ? ` and notify ${notifyLabel}` : '';

  // ── Batch mode ─────────────────────────────────────────────────────────────────
  const batch = parseBatchManifest(output, 'EVYAFINISHDEVBATCH');

  if (batch && Array.isArray(batch.stories) && batch.stories.length > 0) {
    const blocks = parseContentBlocks(output, 'EVYA_DEVSUMMARY');
    const count  = batch.stories.length;

    if (!(await ctx.confirm(
      `Set ${count} stor${count !== 1 ? 'ies' : 'y'} to "Ready for QA" in ${pmLabel}${notifyPart}?\n  ${batch.stories.map(s => s.storyId).join(', ')}`
    ))) {
      ctx.send('Cancelled — state transitions and notifications not sent.');
      return;
    }

    if (cfg.pmTool !== 'local') await pm.ensureCredentials(cfg);
    if (hasNotify)               await notify.ensureCredentials(cfg);

    for (const story of batch.stories) {
      const { storyId } = story;
      const summary     = blocks[storyId];

      if (!summary) {
        ctx.send(`⚠️  Dev summary block for ${storyId} not found in agent output — skipped.`);
        continue;
      }

      const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
        || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
      fs.mkdirSync(storyDir, { recursive: true });
      const out = path.join(storyDir, `${storyId}_DevSummary.md`);
      fs.writeFileSync(out, summary, 'utf8');
      ctx.send(`Saved dev summary → ${out}`);

      if (cfg.pmTool !== 'local') {
        const pmStoryId = adoMap.lookup(cfg.repoRoot, storyId);
        if (!pmStoryId && !cfg.dryRun) {
          ctx.send(`⚠️  ${pmLabel} ID for ${storyId} not found — state change may target wrong item.`);
        }
        const idForPm = pmStoryId || storyId;
        await runIntegration({
          name: `${cfg.pmTool}:set-state(Ready for QA) [#${idForPm}]`, cfg,
          args: { storyId: idForPm, state: 'Ready for QA' },
          live: () => pm.setState(cfg, { storyId: idForPm, state: 'Ready for QA' }),
        });
      }

      if (hasNotify) {
        await runIntegration({
          name: `${cfg.notificationTool}:dev-finished`, cfg,
          args: { storyId },
          live: () => notify.send(cfg, { event: 'dev-finished', storyId }),
        });
      }

      const pmDetail   = cfg.pmTool !== 'local'
        ? ` (${pmLabel} #${adoMap.lookup(cfg.repoRoot, storyId) || storyId})`
        : '';
      const notifyNote = hasNotify ? ' Handoff notification sent.' : '';
      ctx.send(`${storyId} is now Ready for QA${pmDetail}.${notifyNote}`);
    }
    return;
  }

  // ── Single-story fallback (original behaviour) ─────────────────────────────────
  const storyId = ctx.args && ctx.args[0];
  if (!storyId) {
    ctx.send('Missing StoryID. Usage: /evyasys:FinishDev <StoryID|EpicID> [...]');
    return;
  }

  const summary = output;
  if (summary) {
    const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
      || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
    fs.mkdirSync(storyDir, { recursive: true });
    const out = path.join(storyDir, `${storyId}_DevSummary.md`);
    fs.writeFileSync(out, summary, 'utf8');
    ctx.send(`Saved dev summary → ${out}`);
  }

  if (!(await ctx.confirm(`Set ${storyId} to "Ready for QA" in ${pmLabel}${notifyPart}?`))) {
    ctx.send('Cancelled.'); return;
  }

  if (cfg.pmTool !== 'local') {
    const pmStoryId = adoMap.lookup(cfg.repoRoot, storyId);
    if (!pmStoryId && !cfg.dryRun) {
      ctx.send(`Warning: ${pmLabel} ID for ${storyId} not found in map — state change may target the wrong item.`);
    }
    const idForPm = pmStoryId || storyId;
    await pm.ensureCredentials(cfg);
    await runIntegration({
      name: `${cfg.pmTool}:set-state(Ready for QA) [#${idForPm}]`, cfg,
      args: { storyId: idForPm, state: 'Ready for QA' },
      live: () => pm.setState(cfg, { storyId: idForPm, state: 'Ready for QA' }),
    });
  }

  await notify.ensureCredentials(cfg);
  await runIntegration({
    name: `${cfg.notificationTool}:dev-finished`, cfg,
    args: { storyId },
    live: () => notify.send(cfg, { event: 'dev-finished', storyId }),
  });

  const pmDetail = cfg.pmTool !== 'local'
    ? ` (${pmLabel} #${adoMap.lookup(cfg.repoRoot, storyId) || storyId})`
    : '';
  ctx.send(`${storyId} is now Ready for QA${pmDetail}. Handoff notification sent.`);
};

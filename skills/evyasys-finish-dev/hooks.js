/**
 * Post-agent hook for evyasys-finish-dev.
 *
 * Saves the dev summary, transitions the story to "Ready for QA" in the
 * configured PM tool, and sends the handoff notification — all after user approval.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration } = require('../../scripts/lib/dryrun');
const { loadConfig }     = require('../../scripts/lib/config');
const adoMap             = require('../../scripts/lib/ado-map');
const pm                 = require('../../scripts/lib/pm-adapter');
const notify             = require('../../scripts/lib/notify-adapter');

module.exports = async function (ctx) {
  const cfg     = await loadConfig({ ctx });
  const storyId = ctx.args && ctx.args[0];

  if (!storyId) { ctx.send('Missing StoryID. Usage: /evyasys:FinishDev <StoryID>'); return; }

  const summary = ctx.agentResult;
  if (summary) {
    const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
      || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
    fs.mkdirSync(storyDir, { recursive: true });
    const out = path.join(storyDir, `${storyId}_DevSummary.md`);
    fs.writeFileSync(out, summary, 'utf8');
    ctx.send(`Saved dev summary → ${out}`);
  }

  const pmLabel     = pm.toolLabel(cfg);
  const notifyLabel = notify.toolLabel(cfg);
  const notifyPart  = cfg.notificationTool !== 'none' ? ` and notify ${notifyLabel}` : '';

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

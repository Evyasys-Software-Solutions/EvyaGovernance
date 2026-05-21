/**
 * Post-agent hook for evyasys-start-qa.
 *
 * Saves the test plan, transitions the story to "In QA" in the configured PM tool,
 * and sends the QA notification — all after user approval.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration } = require('../../scripts/lib/dryrun');
const { loadConfig }     = require('../../scripts/lib/config');
const adoMap             = require('../../scripts/lib/ado-map');
const pm                 = require('../../scripts/lib/pm-adapter');
const notify             = require('../../scripts/lib/notify-adapter');
const pw                 = require('../../scripts/lib/playwright-manager');

module.exports = async function (ctx) {
  const cfg     = await loadConfig({ ctx });
  const storyId = ctx.args && ctx.args[0];

  if (!storyId) { ctx.send('Missing StoryID. Usage: /evyasys:StartQa <StoryID>'); return; }

  const plan = ctx.agentResult;
  if (plan) {
    const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
      || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
    fs.mkdirSync(storyDir, { recursive: true });
    const out = path.join(storyDir, `${storyId}_TestPlan.md`);
    fs.writeFileSync(out, plan, 'utf8');
    ctx.send(`Saved test plan → ${out}`);
  }

  const pmLabel     = pm.toolLabel(cfg);
  const notifyLabel = notify.toolLabel(cfg);
  const notifyPart  = cfg.notificationTool !== 'none' ? ` and notify ${notifyLabel}` : '';

  if (!(await ctx.confirm(`Set ${storyId} to "In QA" in ${pmLabel}${notifyPart}?`))) {
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
      name: `${cfg.pmTool}:set-state(In QA) [#${idForPm}]`, cfg,
      args: { storyId: idForPm, state: 'In QA' },
      live: () => pm.setState(cfg, { storyId: idForPm, state: 'In QA' }),
    });
  }

  await notify.ensureCredentials(cfg);
  await runIntegration({
    name: `${cfg.notificationTool}:qa-started`, cfg,
    args: { storyId },
    live: () => notify.send(cfg, { event: 'qa-started', storyId }),
  });

  const pmDetail = cfg.pmTool !== 'local'
    ? ` (${pmLabel} #${adoMap.lookup(cfg.repoRoot, storyId) || storyId})`
    : '';

  const passedTcs = pw.loadPassedTests(cfg.repoRoot, storyId);
  const skipNote  = passedTcs.length > 0
    ? ` ${passedTcs.length} TC${passedTcs.length !== 1 ? 's' : ''} already passed from previous run (${passedTcs.map(t => t.id).join(', ')}) — marked skip in spec.`
    : '';

  ctx.send(`${storyId} is now In QA${pmDetail}. QA notification sent.${skipNote}`);
};

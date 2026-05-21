/**
 * Post-agent hook for evyasys-start-dev.
 *
 * Saves the agreed tech brainstorm, then transitions the story to "In Progress"
 * in the configured PM tool and posts the kickoff notification — both only after
 * user approval.
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

  if (!storyId) {
    ctx.send('Missing StoryID. Usage: /evyasys:StartDev <StoryID>');
    return;
  }

  // Save brainstorm document.
  const brainstorm = ctx.brainstorm || ctx.agentResult;
  if (brainstorm) {
    const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
      || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
    fs.mkdirSync(storyDir, { recursive: true });
    const brainstormPath = path.join(storyDir, `${storyId}_TechBrainstorm.md`);
    fs.writeFileSync(brainstormPath, brainstorm, 'utf8');
    ctx.send(`Saved tech brainstorm → ${brainstormPath}`);
  }

  const pmLabel     = pm.toolLabel(cfg);
  const notifyLabel = notify.toolLabel(cfg);
  const notifyPart  = cfg.notificationTool !== 'none' ? ` and notify ${notifyLabel}` : '';

  if (!(await ctx.confirm(`Set ${storyId} to "In Progress" in ${pmLabel}${notifyPart}?`))) {
    ctx.send('Cancelled — state transition and notification not sent.');
    return;
  }

  if (cfg.pmTool !== 'local') {
    const pmStoryId = adoMap.lookup(cfg.repoRoot, storyId);
    if (!pmStoryId && !cfg.dryRun) {
      ctx.send(`Warning: ${pmLabel} ID for ${storyId} not found in map — state change may target the wrong item.`);
    }
    const idForPm = pmStoryId || storyId;

    await pm.ensureCredentials(cfg);
    await runIntegration({
      name: `${cfg.pmTool}:set-state(In Progress) [#${idForPm}]`, cfg,
      args: { storyId: idForPm, state: 'In Progress' },
      live: () => pm.setState(cfg, { storyId: idForPm, state: 'In Progress' }),
    });
  }

  await notify.ensureCredentials(cfg);
  await runIntegration({
    name: `${cfg.notificationTool}:dev-kickoff`, cfg,
    args: { storyId },
    live: () => notify.send(cfg, { event: 'dev-kickoff', storyId }),
  });

  const pmDetail = cfg.pmTool !== 'local'
    ? ` (${pmLabel} #${adoMap.lookup(cfg.repoRoot, storyId) || storyId})`
    : '';
  ctx.send(`${storyId} is now In Progress${pmDetail}. Kickoff notification sent.`);
};

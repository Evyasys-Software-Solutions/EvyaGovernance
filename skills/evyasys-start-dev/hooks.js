/**
 * Post-agent hook for evyasys-start-dev.
 *
 * Saves the agreed tech brainstorm, then transitions ADO → In Progress
 * and posts the Teams kickoff card — both only after user approval.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration }                    = require('../../scripts/lib/dryrun');
const { loadConfig, ensurePat, ensureTeamsWebhook } = require('../../scripts/lib/config');
const adoMap                                = require('../../scripts/lib/ado-map');

module.exports = async function (ctx) {
  const cfg     = await loadConfig({ ctx });
  const storyId = ctx.args && ctx.args[0];

  if (!storyId) {
    ctx.send('Missing StoryID. Usage: /evyasys:StartDev <StoryID>');
    return;
  }

  // Save brainstorm document if the agent produced one.
  // Resolves the story folder from the map; falls back to board/stories/{id}/.
  const brainstorm = ctx.brainstorm || ctx.agentResult;
  if (brainstorm) {
    const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
      || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
    fs.mkdirSync(storyDir, { recursive: true });
    const brainstormPath = path.join(storyDir, `${storyId}_TechBrainstorm.md`);
    fs.writeFileSync(brainstormPath, brainstorm, 'utf8');
    ctx.send(`Saved tech brainstorm → ${brainstormPath}`);
  }

  // Confirm before any ADO / Teams action.
  if (!(await ctx.confirm(`Set ${storyId} to "In Progress" in Azure DevOps and notify Teams?`))) {
    ctx.send('Cancelled — ADO state and Teams notification not sent.');
    return;
  }

  // Resolve ADO numeric ID from the local map.
  // The Evyasys ID (e.g. EVYA-1042) must be converted to the ADO work item number
  // (e.g. 5678) — setState requires the numeric ADO ID, not the Evyasys ID.
  const adoStoryId = adoMap.lookup(cfg.repoRoot, storyId);
  if (!adoStoryId && !cfg.dryRun) {
    ctx.send(`Warning: ADO work item ID for ${storyId} not found in map — state change may target the wrong item. Run /evyasys:CreateStory first to ensure the mapping exists.`);
  }
  const idForAdo = adoStoryId || storyId;

  await ensurePat(cfg, ctx);
  await runIntegration({
    name: `azure-devops:set-state(In Progress) [ADO #${idForAdo}]`,
    cfg,
    args: { storyId: idForAdo, state: 'In Progress' },
    live: async () =>
      require('../../scripts/integrations/azure_devops').setState({ storyId: idForAdo, state: 'In Progress' }),
  });

  await ensureTeamsWebhook(cfg, ctx);
  await runIntegration({
    name: 'teams:dev-kickoff',
    cfg,
    args: { storyId },
    live: async () =>
      require('../../scripts/integrations/teams_webhook').devKickoff({ storyId }),
  });

  ctx.send(`${storyId} is now In Progress (ADO #${idForAdo}). Kickoff card sent to Teams.`);
};

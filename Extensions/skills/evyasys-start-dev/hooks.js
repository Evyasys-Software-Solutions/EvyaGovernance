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

module.exports = async function (ctx) {
  const cfg     = await loadConfig({ ctx });
  const storyId = ctx.args && ctx.args[0];

  if (!storyId) {
    ctx.send('Missing StoryID. Usage: /EvyaStartDev <StoryID>');
    return;
  }

  // Save brainstorm document if the agent produced one
  const brainstorm = ctx.brainstorm || ctx.agentResult;
  if (brainstorm) {
    const storiesDir = path.join(cfg.repoRoot, 'docs', 'stories');
    fs.mkdirSync(storiesDir, { recursive: true });
    const brainstormPath = path.join(storiesDir, `${storyId}_TechBrainstorm.md`);
    fs.writeFileSync(brainstormPath, brainstorm, 'utf8');
    ctx.send(`Saved tech brainstorm → ${brainstormPath}`);
  }

  // Confirm before any ADO / Teams action
  if (!(await ctx.confirm(`Set ${storyId} to "In Progress" in Azure DevOps and notify Teams?`))) {
    ctx.send('Cancelled — ADO state and Teams notification not sent.');
    return;
  }

  await ensurePat(cfg, ctx);
  await runIntegration({
    name: 'azure-devops:set-state(In Progress)',
    cfg,
    args: { storyId, state: 'In Progress' },
    live: async () =>
      require('../../scripts/integrations/azure_devops').setState({ storyId, state: 'In Progress' }),
  });

  await ensureTeamsWebhook(cfg, ctx);
  await runIntegration({
    name: 'teams:dev-kickoff',
    cfg,
    args: { storyId },
    live: async () =>
      require('../../scripts/integrations/teams_webhook').devKickoff({ storyId }),
  });

  ctx.send(`${storyId} is now In Progress. Kickoff card sent to Teams.`);
};

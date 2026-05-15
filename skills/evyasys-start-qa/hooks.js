/**
 * Post-agent hook for evyasys-start-qa.
 *
 * Saves the test plan, transitions ADO → In QA,
 * and posts the Teams notification — all after user approval.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration }                              = require('../../scripts/lib/dryrun');
const { loadConfig, ensurePat, ensureTeamsWebhook }   = require('../../scripts/lib/config');
const adoMap                                          = require('../../scripts/lib/ado-map');

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

  if (!(await ctx.confirm(`Set ${storyId} to "In QA" and notify Teams?`))) {
    ctx.send('Cancelled.'); return;
  }

  // Resolve ADO numeric ID — required for setState; Evyasys IDs are not ADO IDs.
  const adoStoryId = adoMap.lookup(cfg.repoRoot, storyId);
  if (!adoStoryId && !cfg.dryRun) {
    ctx.send(`Warning: ADO work item ID for ${storyId} not found in map — state change may target the wrong item.`);
  }
  const idForAdo = adoStoryId || storyId;

  await ensurePat(cfg, ctx);
  await runIntegration({
    name: `azure-devops:set-state(In QA) [ADO #${idForAdo}]`,
    cfg,
    args: { storyId: idForAdo, state: 'In QA' },
    live: async () =>
      require('../../scripts/integrations/azure_devops').setState({ storyId: idForAdo, state: 'In QA' }),
  });

  await ensureTeamsWebhook(cfg, ctx);
  await runIntegration({
    name: 'teams:qa-started',
    cfg,
    args: { storyId },
    live: async () =>
      require('../../scripts/integrations/teams_webhook').qaStarted({ storyId }),
  });

  ctx.send(`${storyId} is now In QA (ADO #${idForAdo}). QA card sent to Teams.`);
};

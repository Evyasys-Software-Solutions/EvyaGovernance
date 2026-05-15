/**
 * Post-agent hook for evyasys-finish-dev.
 *
 * Saves the dev summary, transitions ADO → Ready for QA,
 * and posts the Teams handoff card — all after user approval.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration }                              = require('../../scripts/lib/dryrun');
const { loadConfig, ensurePat, ensureTeamsWebhook }   = require('../../scripts/lib/config');
const adoMap                                          = require('../../scripts/lib/ado-map');

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

  if (!(await ctx.confirm(`Set ${storyId} to "Ready for QA" and notify Teams?`))) {
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
    name: `azure-devops:set-state(Ready for QA) [ADO #${idForAdo}]`,
    cfg,
    args: { storyId: idForAdo, state: 'Ready for QA' },
    live: async () =>
      require('../../scripts/integrations/azure_devops').setState({ storyId: idForAdo, state: 'Ready for QA' }),
  });

  await ensureTeamsWebhook(cfg, ctx);
  await runIntegration({
    name: 'teams:dev-finished',
    cfg,
    args: { storyId },
    live: async () =>
      require('../../scripts/integrations/teams_webhook').devFinished({ storyId }),
  });

  ctx.send(`${storyId} is now Ready for QA (ADO #${idForAdo}). Handoff card sent to Teams.`);
};

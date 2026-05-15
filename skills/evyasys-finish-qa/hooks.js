/**
 * Post-agent hook for evyasys-finish-qa.
 *
 * Saves release notes, transitions ADO → Done,
 * and posts the Teams release card — all after user approval.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration }                              = require('../../scripts/lib/dryrun');
const { loadConfig, ensurePat, ensureTeamsWebhook }   = require('../../scripts/lib/config');
const adoMap                                          = require('../../scripts/lib/ado-map');

module.exports = async function (ctx) {
  const cfg     = await loadConfig({ ctx });
  const storyId = ctx.args && ctx.args[0];

  if (!storyId) { ctx.send('Missing StoryID. Usage: /evyasys:FinishQa <StoryID>'); return; }

  const notes = ctx.agentResult;
  if (notes) {
    const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
      || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
    fs.mkdirSync(storyDir, { recursive: true });
    const out = path.join(storyDir, `${storyId}_ReleaseNotes.md`);
    fs.writeFileSync(out, notes, 'utf8');
    ctx.send(`Saved release notes → ${out}`);
  }

  if (!(await ctx.confirm(`Set ${storyId} to "Done" and notify Teams?`))) {
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
    name: `azure-devops:set-state(Done) [ADO #${idForAdo}]`,
    cfg,
    args: { storyId: idForAdo, state: 'Done' },
    live: async () =>
      require('../../scripts/integrations/azure_devops').setState({ storyId: idForAdo, state: 'Done' }),
  });

  await ensureTeamsWebhook(cfg, ctx);
  await runIntegration({
    name: 'teams:qa-finished',
    cfg,
    args: { storyId },
    live: async () =>
      require('../../scripts/integrations/teams_webhook').qaFinished({ storyId }),
  });

  ctx.send(`${storyId} is Done (ADO #${idForAdo}). Release card sent to Teams.`);
};

const path = require('path');
const fs = require('fs');
const { runIntegration } = require('../../scripts/lib/dryrun');
const { loadConfig, ensurePat, ensureTeamsWebhook } = require('../../scripts/lib/config');

module.exports = async function (ctx) {
  const cfg = await loadConfig({ ctx });
  const storyId = ctx.args && ctx.args[0];
  if (!storyId) { ctx.send('Missing StoryID. Usage: /EvyaFinishDev <StoryID>'); return; }
  const summary = ctx.agentResult;
  if (summary) {
    const out = path.join(cfg.repoRoot, 'docs', 'stories', `${storyId}_DevSummary.md`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, summary, 'utf8');
    ctx.send(`Saved dev summary → ${out}`);
  }
  if (!(await ctx.confirm(`Set ${storyId} to "Ready for QA" and notify Teams?`))) {
    ctx.send('Cancelled.'); return;
  }
  await ensurePat(cfg, ctx);
  await runIntegration({
    name: 'azure-devops:set-state(Ready for QA)', cfg,
    args: { storyId, state: 'Ready for QA' },
    live: async () => require('../../scripts/integrations/azure_devops').setState({ storyId, state: 'Ready for QA' }),
  });
  await ensureTeamsWebhook(cfg, ctx);
  await runIntegration({
    name: 'teams:dev-finished', cfg,
    args: { storyId },
    live: async () => require('../../scripts/integrations/teams_webhook').devFinished({ storyId }),
  });
};

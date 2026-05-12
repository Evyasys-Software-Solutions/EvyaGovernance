const path = require('path');
const fs = require('fs');
const { runIntegration } = require('../../scripts/lib/dryrun');
const { loadConfig, ensurePat, ensureTeamsWebhook } = require('../../scripts/lib/config');

module.exports = async function (ctx) {
  const cfg = await loadConfig({ ctx });
  const storyId = ctx.args && ctx.args[0];
  if (!storyId) { ctx.send('Missing StoryID. Usage: /evyasys:StartQa <StoryID>'); return; }
  const plan = ctx.agentResult;
  if (plan) {
    const out = path.join(cfg.repoRoot, 'docs', 'stories', `${storyId}_TestPlan.md`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, plan, 'utf8');
    ctx.send(`Saved test plan → ${out}`);
  }
  if (!(await ctx.confirm(`Set ${storyId} to "In QA" and notify Teams?`))) {
    ctx.send('Cancelled.'); return;
  }
  await ensurePat(cfg, ctx);
  await runIntegration({
    name: 'azure-devops:set-state(In QA)', cfg,
    args: { storyId, state: 'In QA' },
    live: async () => require('../../scripts/integrations/azure_devops').setState({ storyId, state: 'In QA' }),
  });
  await ensureTeamsWebhook(cfg, ctx);
  await runIntegration({
    name: 'teams:qa-started', cfg,
    args: { storyId },
    live: async () => require('../../scripts/integrations/teams_webhook').qaStarted({ storyId }),
  });
};

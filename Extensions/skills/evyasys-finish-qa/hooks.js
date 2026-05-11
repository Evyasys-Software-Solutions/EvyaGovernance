const path = require('path');
const fs = require('fs');
const { runIntegration } = require('../../scripts/lib/dryrun');
const { loadConfig, ensurePat, ensureTeamsWebhook } = require('../../scripts/lib/config');

module.exports = async function (ctx) {
  const cfg = await loadConfig({ ctx });
  const storyId = ctx.args && ctx.args[0];
  if (!storyId) { ctx.send('Missing StoryID. Usage: /EvyaFinishQa <StoryID>'); return; }
  const notes = ctx.agentResult;
  if (notes) {
    const out = path.join(cfg.repoRoot, 'docs', 'stories', `${storyId}_ReleaseNotes.md`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, notes, 'utf8');
    ctx.send(`Saved release notes → ${out}`);
  }
  if (!(await ctx.confirm(`Set ${storyId} to "Done" and notify Teams?`))) {
    ctx.send('Cancelled.'); return;
  }
  await ensurePat(cfg, ctx);
  await runIntegration({
    name: 'azure-devops:set-state(Done)', cfg,
    args: { storyId, state: 'Done' },
    live: async () => require('../../scripts/integrations/azure_devops').setState({ storyId, state: 'Done' }),
  });
  await ensureTeamsWebhook(cfg, ctx);
  await runIntegration({
    name: 'teams:qa-finished', cfg,
    args: { storyId },
    live: async () => require('../../scripts/integrations/teams_webhook').qaFinished({ storyId }),
  });
};

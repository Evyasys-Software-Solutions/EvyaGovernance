const path = require('path');
const fs = require('fs');
const { runIntegration } = require('../../scripts/lib/dryrun');
const { loadConfig, ensurePat } = require('../../scripts/lib/config');

module.exports = async function (ctx) {
  const cfg = await loadConfig({ ctx });
  const storyId = ctx.args && ctx.args[0];
  if (!storyId) { ctx.send('Missing StoryID. Usage: /evyasys:CreateSubtask <StoryID>'); return; }
  const tasks = ctx.agentResult;
  if (!tasks) { ctx.send('No task list in context — aborting.'); return; }
  if (!(await ctx.confirm(`Create ${storyId} subtasks in Azure DevOps?`))) {
    ctx.send('Subtask creation cancelled.'); return;
  }
  const out = path.join(cfg.repoRoot, 'docs', 'stories', `${storyId}_Subtasks.md`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, tasks, 'utf8');
  ctx.send(`Saved subtasks → ${out}`);
  await ensurePat(cfg, ctx);
  await runIntegration({
    name: 'azure-devops:create-subtasks', cfg,
    args: { storyId, file: out },
    live: async () => require('../../scripts/integrations/azure_devops').createSubtasks({ storyId, file: out }),
  });
};

const path = require('path');
const fs   = require('fs');
const { runIntegration }                            = require('../../scripts/lib/dryrun');
const { loadConfig, ensurePat, ensureTeamsWebhook } = require('../../scripts/lib/config');
const adoMap                                        = require('../../scripts/lib/ado-map');

module.exports = async function (ctx) {
  const cfg     = await loadConfig({ ctx });
  const storyId = ctx.args && ctx.args[0];

  if (!storyId) { ctx.send('Missing StoryID. Usage: /evyasys:CreateSubtask <StoryID>'); return; }
  const tasks = ctx.agentResult;
  if (!tasks) { ctx.send('No task list in context — aborting.'); return; }

  if (!(await ctx.confirm(`Create ${storyId} subtasks in Azure DevOps and notify Teams?`))) {
    ctx.send('Subtask creation cancelled.'); return;
  }

  // Resolve subtasks directory from the story's saved folder in the map.
  // Falls back to board/stories/{storyId}/subtasks/ if the story was not mapped
  // (e.g. created manually or before this version).
  const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
    || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
  const subtasksDir = path.join(storyDir, 'subtasks');
  fs.mkdirSync(subtasksDir, { recursive: true });
  const out = path.join(subtasksDir, `${storyId}_Subtasks.md`);
  fs.writeFileSync(out, tasks, 'utf8');
  ctx.send(`Saved subtasks → ${out}`);

  const taskCount = (tasks.match(/^##\s+Task\s+\d+/gim) || []).length || undefined;

  // Look up the parent story's ADO numeric ID so each task can be linked to it.
  const storyAdoId = adoMap.lookup(cfg.repoRoot, storyId);
  if (!storyAdoId) {
    ctx.send(`Note: ADO ID for ${storyId} not found in map — tasks will be created without a story link. Run /evyasys:CreateStory first to ensure the mapping exists.`);
  }

  await ensurePat(cfg, ctx);
  const subtaskResults = await runIntegration({
    name: 'azure-devops:create-subtasks', cfg,
    args: { storyId, file: out, storyAdoId },
    live: async () => require('../../scripts/integrations/azure_devops').createSubtasks({
      storyId,
      file: out,
      storyAdoId,
    }),
  });

  // Back-write ADO work item IDs into each ## Task N header so the file stays
  // aligned with the Azure DevOps board numbers.
  if (!cfg.dryRun && Array.isArray(subtaskResults) && subtaskResults.some(r => r && r.id)) {
    let md = fs.readFileSync(out, 'utf8');
    let idx = 0;
    md = md.replace(/^(##\s+Task\s+\d+[^\n]*)/gim, (match) => {
      const result = subtaskResults[idx++];
      return (result && result.id && !match.includes('ADO #'))
        ? `${match} · ADO #${result.id}`
        : match;
    });
    fs.writeFileSync(out, md, 'utf8');
    ctx.send(`Updated subtask file with ADO work item IDs.`);
  }

  await ensureTeamsWebhook(cfg, ctx);
  await runIntegration({
    name: 'teams:subtasks-created', cfg,
    args: { storyId, count: taskCount },
    live: async () => require('../../scripts/integrations/teams_webhook').subtasksCreated({ storyId, count: taskCount }),
  });
};

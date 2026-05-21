/**
 * Post-agent hook for evyasys-create-subtask.
 *
 * 1. Saves subtask list to .evyasys/board/…/<storyId>/subtasks/<storyId>_Subtasks.md.
 * 2. Creates work items in the configured PM tool and links them to the parent story.
 * 3. Back-writes PM tool IDs into each ## Task N header so the file stays aligned.
 * 4. Sends a notification via the configured notification tool.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration } = require('../../scripts/lib/dryrun');
const { loadConfig }     = require('../../scripts/lib/config');
const adoMap             = require('../../scripts/lib/ado-map');
const pm                 = require('../../scripts/lib/pm-adapter');
const notify             = require('../../scripts/lib/notify-adapter');
const pw                 = require('../../scripts/lib/playwright-manager');

module.exports = async function (ctx) {
  const cfg     = await loadConfig({ ctx });
  const storyId = ctx.args && ctx.args[0];

  if (!storyId) { ctx.send('Missing StoryID. Usage: /evyasys:CreateSubtask <StoryID>'); return; }
  const rawOutput = ctx.agentResult;
  if (!rawOutput) { ctx.send('No task list in context — aborting.'); return; }

  // Strip the EVYASPEC block (if present) before saving the subtasks file.
  const { testCases, cleanedOutput } = pw.parseSpecBlock(rawOutput);
  const tasks = cleanedOutput || rawOutput;

  const pmLabel     = pm.toolLabel(cfg);
  const notifyLabel = notify.toolLabel(cfg);
  const notifyPart  = cfg.notificationTool !== 'none' ? ` and notify ${notifyLabel}` : '';

  if (!(await ctx.confirm(`Create ${storyId} subtasks in ${pmLabel}${notifyPart}?`))) {
    ctx.send('Subtask creation cancelled.'); return;
  }

  // Resolve subtasks directory.
  const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
    || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
  const subtasksDir = path.join(storyDir, 'subtasks');
  fs.mkdirSync(subtasksDir, { recursive: true });
  const out = path.join(subtasksDir, `${storyId}_Subtasks.md`);
  fs.writeFileSync(out, tasks, 'utf8');
  ctx.send(`Saved subtasks → ${out}`);

  const taskCount = (tasks.match(/^##\s+Task\s+\d+/gim) || []).length || undefined;

  // Look up parent story PM ID for hierarchy linking.
  const storyPmId = adoMap.lookup(cfg.repoRoot, storyId);
  if (!storyPmId && cfg.pmTool !== 'local') {
    ctx.send(`Note: PM ID for ${storyId} not found in map — tasks will be created without a story link. Run /evyasys:CreateStory first.`);
  }

  if (cfg.pmTool !== 'local') {
    await pm.ensureCredentials(cfg);
    const subtaskResults = await runIntegration({
      name: `${cfg.pmTool}:create-subtasks`, cfg,
      args: { storyId, file: out, storyAdoId: storyPmId },
      live: () => pm.createSubtasks(cfg, { storyId, file: out, storyAdoId: storyPmId }),
    });

    // Back-write PM tool IDs into the subtasks file.
    if (!cfg.dryRun && Array.isArray(subtaskResults) && subtaskResults.some(r => r && r.id)) {
      let md = fs.readFileSync(out, 'utf8');
      let idx = 0;
      md = md.replace(/^(##\s+Task\s+\d+[^\n]*)/gim, (match) => {
        const result = subtaskResults[idx++];
        return (result && result.id && !match.includes(`${pmLabel} #`))
          ? `${match} · ${pmLabel} #${result.id}`
          : match;
      });
      fs.writeFileSync(out, md, 'utf8');
      ctx.send(`Updated subtask file with ${pmLabel} work item IDs.`);
    }
  }

  await notify.ensureCredentials(cfg);
  await runIntegration({
    name: `${cfg.notificationTool}:subtasks-created`, cfg,
    args: { storyId, count: taskCount },
    live: () => notify.send(cfg, { event: 'subtasks-created', storyId, count: taskCount }),
  });

  // Scaffold Playwright spec from test cases embedded by the agent.
  if (Array.isArray(testCases) && testCases.length > 0) {
    const specFile = pw.scaffoldSpec(cfg.repoRoot, storyId, testCases);
    ctx.send(`Playwright spec scaffolded → ${specFile} (${testCases.length} test case${testCases.length !== 1 ? 's' : ''})`);
  }

  const countLabel = taskCount ? `${taskCount} task${taskCount !== 1 ? 's' : ''}` : 'tasks';
  ctx.send(`${storyId} subtasks created (${countLabel}).${cfg.pmTool !== 'local' ? ` ${pmLabel} IDs back-written.` : ''} Notification sent.`);
};

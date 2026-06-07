/**
 * Post-agent hook for evyasys-create-subtask (batch mode).
 *
 * Two processing modes driven by EVYASUBTASKBATCH.inputMode:
 *
 *   "story" — user passed individual story IDs.
 *             For each story: save local → PM sync → notify immediately.
 *
 *   "epic"  — user passed epic IDs (or a mix).
 *             For each epic group: save all stories local → PM sync all → notify once.
 *             Stories not in any epic group fall back to story-wise processing.
 *
 * Single confirmation gate covers the whole batch regardless of mode.
 * On any PM sync failure: local file is always saved, user notified inline — batch continues.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration } = require('../../scripts/lib/dryrun');
const { loadConfig }     = require('../../scripts/lib/config');
const adoMap             = require('../../scripts/lib/ado-map');
const pm                 = require('../../scripts/lib/pm-adapter');
const notify             = require('../../scripts/lib/notify-adapter');
const pw                 = require('../../scripts/lib/playwright-manager');

// ── Parsers ───────────────────────────────────────────────────────────────────

function parseBatchManifest(text) {
  const m = text && text.match(/<!--\s*EVYASUBTASKBATCH\s*([\s\S]*?)-->/i);
  if (!m) return null;
  try { return JSON.parse(m[1].trim()); } catch { return null; }
}

function parseSubtasksBlocks(text) {
  const out     = {};
  const startRe = /=== EVYA_SUBTASKS: ([\w-]+) ===/g;
  let sm;
  while ((sm = startRe.exec(text)) !== null) {
    const id     = sm[1];
    const after  = text.slice(sm.index + sm[0].length);
    const endTag = `=== END_EVYA_SUBTASKS: ${id} ===`;
    const endIdx = after.indexOf('\n' + endTag);
    if (endIdx !== -1) {
      out[id] = after.slice(1, endIdx);
    }
  }
  return out;
}

function parseSpecBlocks(text) {
  const out = {};
  const re  = /<!--\s*EVYASPEC:([\w-]+)\s*([\s\S]*?)-->/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const id      = m[1];
    const payload = m[2].trim();
    try { out[id] = JSON.parse(payload); } catch { out[id] = []; }
  }
  return out;
}

// ── Main hook ─────────────────────────────────────────────────────────────────

module.exports = async function (ctx) {
  const cfg    = await loadConfig({ ctx });
  const output = ctx.agentResult || '';

  const batch = parseBatchManifest(output);
  if (!batch || !Array.isArray(batch.stories) || !batch.stories.length) {
    ctx.send(
      'No EVYASUBTASKBATCH block found in agent output — nothing was saved.\n' +
      'Ask the agent to complete the subtask planning and output the EVYASUBTASKBATCH manifest block.'
    );
    return;
  }

  const subtasksBlocks = parseSubtasksBlocks(output);
  const specBlocks     = parseSpecBlocks(output);

  const inputMode  = batch.inputMode || 'story';
  const epicGroups = (inputMode === 'epic' && Array.isArray(batch.epicGroups) && batch.epicGroups.length > 0)
                       ? batch.epicGroups
                       : null;

  const pmLabel     = pm.toolLabel(cfg);
  const notifyLabel = notify.toolLabel(cfg);
  const hasNotify   = cfg.notificationTool !== 'none';
  const storyCount  = batch.stories.length;

  const modeDesc   = epicGroups
    ? `${epicGroups.length} epic${epicGroups.length !== 1 ? 's' : ''} (${storyCount} stor${storyCount !== 1 ? 'ies' : 'y'})`
    : `${storyCount} stor${storyCount !== 1 ? 'ies' : 'y'}`;
  const notifyLine = hasNotify
    ? (epicGroups
        ? ` · 1 notification per epic via ${notifyLabel}`
        : ` · 1 notification per story via ${notifyLabel}`)
    : '';

  // ── Single confirmation gate ─────────────────────────────────────────────────
  if (!(await ctx.confirm(
    `Create subtasks for ${modeDesc} in ${pmLabel}?${notifyLine}`
  ))) {
    ctx.send('Batch subtask creation cancelled. All drafts are preserved in this session.');
    return;
  }

  if (cfg.pmTool !== 'local') {
    await pm.ensureCredentials(cfg);
  }
  if (hasNotify) {
    await notify.ensureCredentials(cfg);
  }

  const storyResults = [];

  // ── Helpers ───────────────────────────────────────────────────────────────────

  /** Save one story's subtasks to disk and scaffold its Playwright spec.
   *  Returns a partial result object (status='saved', pmIds=[]) + the filePath used. */
  function saveStoryLocal(story) {
    const { storyId, title, epicId } = story;

    const subtasksContent = subtasksBlocks[storyId];
    if (!subtasksContent) {
      ctx.send(`⚠️  Story ${storyId} content block not found in agent output — skipped.`);
      return { result: { storyId, title, epicId, taskCount: 0, pmIds: [], specCount: 0, status: 'skipped', error: 'Content block missing' }, filePath: null };
    }

    const storyDir    = adoMap.lookupDir(cfg.repoRoot, storyId)
                      || (epicId
                            ? path.join(cfg.repoRoot, '.evyasys', 'board', 'epics', epicId, 'stories', storyId)
                            : path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId));
    const subtasksDir = path.join(storyDir, 'subtasks');
    fs.mkdirSync(subtasksDir, { recursive: true });
    const filePath    = path.join(subtasksDir, `${storyId}_Subtasks.md`);
    fs.writeFileSync(filePath, subtasksContent, 'utf8');

    const taskCount = (subtasksContent.match(/^##\s+Task\s+\d+/gim) || []).length || 0;

    const testCases = specBlocks[storyId];
    let specCount   = 0;
    if (Array.isArray(testCases) && testCases.length > 0) {
      try {
        const specFile = pw.scaffoldSpec(cfg.repoRoot, storyId, testCases);
        specCount      = testCases.length;
        ctx.send(`Playwright spec scaffolded → ${specFile} (${specCount} test case${specCount !== 1 ? 's' : ''})`);
      } catch (err) {
        ctx.send(`⚠️  Could not scaffold Playwright spec for ${storyId}: ${err.message}`);
      }
    }

    return { result: { storyId, title, epicId, taskCount, pmIds: [], specCount, status: 'saved' }, filePath };
  }

  /** PM-sync one story's saved subtask file. Mutates result.status and result.pmIds in place. */
  async function syncStoryToPm(result, filePath) {
    if (cfg.pmTool === 'local' || result.status === 'skipped') return;

    const { storyId } = result;
    const storyPmId   = adoMap.lookup(cfg.repoRoot, storyId);
    if (!storyPmId) {
      ctx.send(
        `⚠️  PM ID for ${storyId} not found in map — subtasks will be created without a parent story link. ` +
        'Run /evyasys:CreateStory first to sync the parent story.'
      );
    }

    const subtaskResults = await runIntegration({
      name: `${cfg.pmTool}:create-subtasks`, cfg,
      args: { storyId, file: filePath, storyAdoId: storyPmId },
      live: () => pm.createSubtasks(cfg, { storyId, file: filePath, storyAdoId: storyPmId }),
    });

    const pmIds = [];
    if (!cfg.dryRun && Array.isArray(subtaskResults) && subtaskResults.some(r => r && r.id)) {
      let md  = fs.readFileSync(filePath, 'utf8');
      let idx = 0;
      md = md.replace(/^(##\s+Task\s+\d+[^\n]*)/gim, (match) => {
        const r = subtaskResults[idx++];
        if (r && r.id) {
          pmIds.push(r.id);
          return (!match.includes(`${pmLabel} #`)) ? `${match} · ${pmLabel} #${r.id}` : match;
        }
        return match;
      });
      fs.writeFileSync(filePath, md, 'utf8');
    }

    const hasError = !Array.isArray(subtaskResults) || subtaskResults.some(r => r && r.error);
    if (hasError) {
      const errMsg = (Array.isArray(subtaskResults) && subtaskResults[0] && subtaskResults[0].error) || 'PM sync failed';
      ctx.send(`⚠️  ${storyId} subtasks saved locally — ${pmLabel} sync failed: ${errMsg}.`);
      result.status = 'sync-failed';
      result.error  = errMsg;
    } else {
      result.status = 'synced';
      result.pmIds  = pmIds;
    }
  }

  /** Fire a subtasks-batch-created notification for a slice of story results. */
  async function notifyGroup(groupResults, projectName, groupCrossFlags, groupSharedTasks) {
    await runIntegration({
      name: `${cfg.notificationTool}:subtasks-batch-created`, cfg,
      args: {
        stories:         groupResults,
        sharedTasks:     groupSharedTasks || [],
        crossStoryFlags: groupCrossFlags  || [],
        projectName:     projectName      || '',
      },
      live: () => notify.send(cfg, {
        event:           'subtasks-batch-created',
        stories:         groupResults,
        sharedTasks:     groupSharedTasks || [],
        crossStoryFlags: groupCrossFlags  || [],
        projectName:     projectName      || '',
      }),
    }).catch((err) => {
      ctx.send(`⚠️  Notification failed: ${err.message}`);
    });
  }

  // ── Story-wise: save → PM sync → notify, one story at a time ─────────────────

  async function processStoriesOneByOne(stories) {
    for (const story of stories) {
      const { result, filePath } = saveStoryLocal(story);
      await syncStoryToPm(result, filePath);
      storyResults.push(result);

      if (hasNotify) {
        await notifyGroup(
          [result],
          batch.projectName || '',
          [],
          []
        );
      }
    }
  }

  // ── Epic-wise: save all in epic → PM sync all → notify once per epic ──────────

  async function processEpicGroups(groups) {
    const allEpicStoryIds = new Set(groups.flatMap(eg => eg.storyIds || []));

    for (const epicGroup of groups) {
      const epicStories = batch.stories.filter(s => (epicGroup.storyIds || []).includes(s.storyId));
      if (!epicStories.length) continue;

      // Phase 1 — save all stories in this epic to local
      const epicEntries = epicStories.map(s => saveStoryLocal(s));

      const localCount = epicEntries.filter(e => e.result.status !== 'skipped').length;
      ctx.send(`Epic ${epicGroup.epicId}: ${localCount} stor${localCount !== 1 ? 'ies' : 'y'} saved locally. Syncing to ${pmLabel}…`);

      // Phase 2 — PM sync all stories in this epic
      for (const { result, filePath } of epicEntries) {
        await syncStoryToPm(result, filePath);
      }

      const epicResults = epicEntries.map(e => e.result);
      storyResults.push(...epicResults);

      // Phase 3 — one notification for this epic
      if (hasNotify) {
        const epicIds      = new Set(epicStories.map(s => s.storyId));
        const epicCrossFlags  = (batch.crossStoryFlags || []).filter(f => epicStories.some(s => f.includes(s.storyId)));
        const epicSharedTasks = (batch.sharedTasks     || []).filter(t => (t.linkedStories || []).some(id => epicIds.has(id)));
        await notifyGroup(
          epicResults,
          batch.projectName || (epicGroup.epicId !== '_standalone' ? epicGroup.epicId : ''),
          epicCrossFlags,
          epicSharedTasks
        );
      }
    }

    // Any stories not in an epic group fall back to story-wise
    const ungrouped = batch.stories.filter(s => !allEpicStoryIds.has(s.storyId));
    if (ungrouped.length) {
      await processStoriesOneByOne(ungrouped);
    }
  }

  // ── Dispatch ──────────────────────────────────────────────────────────────────

  if (epicGroups) {
    await processEpicGroups(epicGroups);
  } else {
    await processStoriesOneByOne(batch.stories);
  }

  // ── Final text summary ────────────────────────────────────────────────────────

  const synced     = storyResults.filter(s => s.status === 'synced').length;
  const savedLocal = storyResults.filter(s => s.status === 'saved').length;
  const failed     = storyResults.filter(s => s.status === 'sync-failed').length;
  const skipped    = storyResults.filter(s => s.status === 'skipped').length;
  const totalTasks = storyResults.reduce((n, s) => n + (s.taskCount || 0), 0);

  ctx.send(
    `✅ Batch complete — ${totalTasks} task${totalTasks !== 1 ? 's' : ''} across ${storyResults.length} stor${storyResults.length !== 1 ? 'ies' : 'y'}.\n` +
    (synced     > 0 ? `  • ${synced} stor${synced !== 1 ? 'ies' : 'y'} synced to ${pmLabel}\n`                   : '') +
    (savedLocal > 0 ? `  • ${savedLocal} stor${savedLocal !== 1 ? 'ies' : 'y'} saved locally (local-only mode)\n` : '') +
    (failed     > 0 ? `  ⚠️  ${failed} PM sync failed — saved locally, sync when resolved\n`                      : '') +
    (skipped    > 0 ? `  ⚠️  ${skipped} skipped — content block missing, re-run if needed\n`                      : '')
  );
};

/**
 * Post-agent hook for evyasys-create-subtask (batch mode).
 *
 * Flow:
 *  1. Parse EVYASUBTASKBATCH manifest
 *  2. Parse EVYA_SUBTASKS content blocks (one per story)
 *  3. Parse EVYASPEC:{storyId} blocks (one per story)
 *  4. Single confirmation gate (covers all stories)
 *  5. Per story (sequential):
 *       save file → lookup parent PM ID → create subtasks (linked to parent)
 *       → back-write PM IDs → scaffold Playwright spec
 *  6. Single subtasks-batch-created notification with full results
 *
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
      // strip the leading newline after the start tag
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

  const pmLabel     = pm.toolLabel(cfg);
  const notifyLabel = notify.toolLabel(cfg);
  const hasNotify   = cfg.notificationTool !== 'none';
  const storyCount  = batch.stories.length;
  const notifyLine  = hasNotify ? ` · 1 notification via ${notifyLabel}` : '';

  // ── Single confirmation gate ─────────────────────────────────────────────────
  if (!(await ctx.confirm(
    `Create subtasks for ${storyCount} stor${storyCount !== 1 ? 'ies' : 'y'} in ${pmLabel}?${notifyLine}`
  ))) {
    ctx.send('Batch subtask creation cancelled. All drafts are preserved in this session.');
    return;
  }

  if (cfg.pmTool !== 'local') {
    await pm.ensureCredentials(cfg);
  }

  // ── Per-story processing (sequential) ────────────────────────────────────────
  const storyResults = [];

  for (const story of batch.stories) {
    const { storyId, title, epicId } = story;

    const subtasksContent = subtasksBlocks[storyId];
    if (!subtasksContent) {
      ctx.send(`⚠️  Story ${storyId} content block not found in agent output — skipped.`);
      storyResults.push({ storyId, title, epicId, taskCount: 0, pmIds: [], specCount: 0, status: 'skipped', error: 'Content block missing' });
      continue;
    }

    // Resolve subtasks directory — prefer adoMap dir, then epic-based, then flat
    const storyDir   = adoMap.lookupDir(cfg.repoRoot, storyId)
                    || (epicId
                          ? path.join(cfg.repoRoot, '.evyasys', 'board', 'epics', epicId, 'stories', storyId)
                          : path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId));
    const subtasksDir = path.join(storyDir, 'subtasks');
    fs.mkdirSync(subtasksDir, { recursive: true });
    const filePath  = path.join(subtasksDir, `${storyId}_Subtasks.md`);
    fs.writeFileSync(filePath, subtasksContent, 'utf8');

    const taskCount = (subtasksContent.match(/^##\s+Task\s+\d+/gim) || []).length || 0;

    // Scaffold Playwright specs first so specCount is known before building the result object
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

    if (cfg.pmTool === 'local') {
      storyResults.push({ storyId, title, epicId, taskCount, pmIds: [], specCount, status: 'saved' });
    } else {
      // Look up parent story PM ID for hierarchy linking
      const storyPmId = adoMap.lookup(cfg.repoRoot, storyId);
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
          const result = subtaskResults[idx++];
          if (result && result.id) {
            pmIds.push(result.id);
            return (!match.includes(`${pmLabel} #`))
              ? `${match} · ${pmLabel} #${result.id}`
              : match;
          }
          return match;
        });
        fs.writeFileSync(filePath, md, 'utf8');
      }

      const hasError = !Array.isArray(subtaskResults) || subtaskResults.some(r => r && r.error);
      if (hasError) {
        const errMsg = (Array.isArray(subtaskResults) && subtaskResults[0] && subtaskResults[0].error)
          || 'PM sync failed';
        ctx.send(`⚠️  ${storyId} subtasks saved locally — ${pmLabel} sync failed: ${errMsg}.`);
        storyResults.push({ storyId, title, epicId, taskCount, pmIds: [], specCount, status: 'sync-failed', error: errMsg });
      } else {
        storyResults.push({ storyId, title, epicId, taskCount, pmIds, specCount, status: 'synced' });
      }
    }
  }

  // ── Single notification ───────────────────────────────────────────────────────
  if (hasNotify) {
    await notify.ensureCredentials(cfg);
    await runIntegration({
      name: `${cfg.notificationTool}:subtasks-batch-created`, cfg,
      args: {
        stories:         storyResults,
        sharedTasks:     batch.sharedTasks     || [],
        crossStoryFlags: batch.crossStoryFlags || [],
        projectName:     batch.projectName     || '',
      },
      live: () => notify.send(cfg, {
        event:           'subtasks-batch-created',
        stories:         storyResults,
        sharedTasks:     batch.sharedTasks     || [],
        crossStoryFlags: batch.crossStoryFlags || [],
        projectName:     batch.projectName     || '',
      }),
    }).catch(() => {});
  }

  // ── Session summary ───────────────────────────────────────────────────────────
  const synced     = storyResults.filter(s => s.status === 'synced').length;
  const savedLocal = storyResults.filter(s => s.status === 'saved').length;
  const failed     = storyResults.filter(s => s.status === 'sync-failed').length;
  const skipped    = storyResults.filter(s => s.status === 'skipped').length;
  const totalTasks = storyResults.reduce((n, s) => n + (s.taskCount || 0), 0);

  ctx.send(
    `✅ Batch complete — ${totalTasks} task${totalTasks !== 1 ? 's' : ''} across ${storyResults.length} stor${storyResults.length !== 1 ? 'ies' : 'y'}.\n` +
    (synced     > 0 ? `  • ${synced} stor${synced !== 1 ? 'ies' : 'y'} synced to ${pmLabel}\n`                  : '') +
    (savedLocal > 0 ? `  • ${savedLocal} stor${savedLocal !== 1 ? 'ies' : 'y'} saved locally (local-only mode)\n` : '') +
    (failed     > 0 ? `  ⚠️  ${failed} PM sync failed — saved locally, sync when resolved\n`                    : '') +
    (skipped    > 0 ? `  ⚠️  ${skipped} skipped — content block missing, re-run if needed\n`                    : '')
  );
};

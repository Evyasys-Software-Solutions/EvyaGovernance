/**
 * Post-agent hook for evyasys-create-story.
 *
 * Processes the EVYABATCH manifest + delimited epic/story blocks from agent output.
 *
 * Flow:
 *  1. Parse EVYABATCH manifest (epics + stories metadata)
 *  2. Extract epic and story markdown from delimited === EVYA_* === blocks
 *  3. Single confirmation gate (covers all epics + stories)
 *  4. Epics — sequential: save locally + sync to PM tool
 *  5. Notification A — epics table (all epics, New/Existing status)
 *  6. Stories — sequential: save locally + sync PM + back-write ID
 *  7. Notification B — stories batch table (all stories, sync status)
 *
 * On any PM sync failure: local file is always saved, adoId recorded as null,
 * user is notified inline — batch continues.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration } = require('../../scripts/lib/dryrun');
const { loadConfig }     = require('../../scripts/lib/config');
const adoMap             = require('../../scripts/lib/ado-map');
const pm                 = require('../../scripts/lib/pm-adapter');
const notify             = require('../../scripts/lib/notify-adapter');

// ── Parsers ───────────────────────────────────────────────────────────────────

function parseBatchBlock(text) {
  const m = text && text.match(/<!--\s*EVYABATCH\s*([\s\S]*?)-->/i);
  if (!m) return null;
  try { return JSON.parse(m[1].trim()); } catch { return null; }
}

function parseDelimitedBlocks(text, tag) {
  const out      = {};
  const startRe  = new RegExp(`=== EVYA_${tag}: ([\\w-]+) ===`, 'g');
  let   sm;
  while ((sm = startRe.exec(text)) !== null) {
    const id     = sm[1];
    const after  = text.slice(sm.index + sm[0].length);
    const endTag = `=== END_EVYA_${tag}: ${id} ===`;
    const endIdx = after.indexOf('\n' + endTag);
    if (endIdx !== -1) {
      // strip the leading newline after the start tag
      out[id] = after.slice(1, endIdx);
    }
  }
  return out;
}

// ── Main hook ─────────────────────────────────────────────────────────────────

module.exports = async function (ctx) {
  const cfg    = await loadConfig({ ctx });
  const output = ctx.agentResult || '';

  const batch = parseBatchBlock(output);
  if (!batch || !batch.stories || !batch.stories.length) {
    ctx.send(
      'No EVYABATCH block found in agent output — nothing was saved.\n' +
      'Ask the agent to complete the story planning and output the EVYABATCH manifest block.'
    );
    return;
  }

  const epicBlocks  = parseDelimitedBlocks(output, 'EPIC');
  const storyBlocks = parseDelimitedBlocks(output, 'STORY');

  const pmLabel     = pm.toolLabel(cfg);
  const notifyLabel = notify.toolLabel(cfg);
  const hasNotify   = cfg.notificationTool !== 'none';
  const batchEpics  = batch.epics || [];
  const newEpics    = batchEpics.filter(e => e.status === 'new');
  const storyCount  = batch.stories.length;

  // ── Single confirmation gate ─────────────────────────────────────────────────
  const epicLine   = newEpics.length > 0 ? `${newEpics.length} epic(s) and ` : '';
  const notifyLine = hasNotify ? ` · 2 notifications via ${notifyLabel}` : '';

  if (!(await ctx.confirm(
    `Save ${epicLine}${storyCount} story/stories to ${pmLabel}?${notifyLine}`
  ))) {
    ctx.send('Batch creation cancelled. All drafts are preserved in this session.');
    return;
  }

  if (cfg.pmTool !== 'local') {
    await pm.ensureCredentials(cfg);
  }

  // ── Epic processing (sequential) ─────────────────────────────────────────────
  const epicResults = {}; // epicId → { pmId, status, title }

  for (const epic of batchEpics) {
    const { epicId, title, status } = epic;

    if (status === 'existing') {
      // Resolve from local map first (fast path)
      const mappedId = adoMap.lookup(cfg.repoRoot, epicId);
      if (mappedId) {
        epicResults[epicId] = { pmId: mappedId, status: 'existing', title };
        continue;
      }

      // Try PM tool lookup if not cached
      if (cfg.pmTool !== 'local') {
        const foundId = await runIntegration({
          name: `${cfg.pmTool}:find-epic`, cfg, args: { epicId },
          live: () => pm.findEpic(cfg, { epicId }),
        });
        if (foundId && !foundId.error && !foundId.dryRun) {
          adoMap.save(cfg.repoRoot, { [epicId]: foundId });
          epicResults[epicId] = { pmId: foundId, status: 'existing', title };
        } else {
          // Epic exists locally but not found in PM tool
          epicResults[epicId] = { pmId: null, status: 'existing-not-synced', title };
          ctx.send(
            `⚠️  Epic ${epicId} (${title}) not found in ${pmLabel}. ` +
            'Saved locally — stories will be created and linked once the epic is synced to the PM tool.'
          );
        }
      } else {
        epicResults[epicId] = { pmId: null, status: 'existing-local', title };
      }
      continue;
    }

    // NEW epic: save local file + PM sync
    const epicDir = path.join(cfg.repoRoot, '.evyasys', 'board', 'epics', epicId);
    fs.mkdirSync(epicDir, { recursive: true });

    const epicContent = epicBlocks[epicId];
    const epicFilePath = path.join(epicDir, `${epicId}_Epic.md`);
    if (epicContent) {
      fs.writeFileSync(epicFilePath, epicContent, 'utf8');
    }

    if (cfg.pmTool === 'local') {
      epicResults[epicId] = { pmId: null, status: 'new-local', title };
      continue;
    }

    const epicResult = await runIntegration({
      name: `${cfg.pmTool}:create-epic`, cfg,
      args: { epicId, title },
      live: () => pm.createEpic(cfg, { epicId, title }),
    });

    if (epicResult && epicResult.id && !epicResult.error) {
      adoMap.save(cfg.repoRoot, { [epicId]: epicResult.id });
      // Back-write PM ID into epic file
      if (epicContent && fs.existsSync(epicFilePath)) {
        let content = fs.readFileSync(epicFilePath, 'utf8');
        if (!content.includes(`${pmLabel} Epic:`)) {
          content = content.replace(/^(Status:.*)$/m, `$1\n${pmLabel} Epic: #${epicResult.id}`);
          fs.writeFileSync(epicFilePath, content, 'utf8');
        }
      }
      epicResults[epicId] = { pmId: epicResult.id, status: 'new', title };
      ctx.send(`Created Epic ${epicId} — ${title} in ${pmLabel} (#${epicResult.id})`);
    } else {
      const errMsg = (epicResult && epicResult.error) || 'PM sync failed';
      epicResults[epicId] = { pmId: null, status: 'new-sync-failed', title, error: errMsg };
      ctx.send(
        `⚠️  Epic ${epicId} (${title}) saved locally — ${pmLabel} sync failed: ${errMsg}. ` +
        'Stories will be saved locally and synced when resolved.'
      );
    }
  }

  // ── Notification A: epics table ──────────────────────────────────────────────
  if (hasNotify) {
    const epicsForNotif = batchEpics.map(e => ({
      epicId:  e.epicId,
      title:   e.title,
      status:  e.status === 'new' ? 'New' : 'Existing',
      pmId:    epicResults[e.epicId]?.pmId ?? null,
      pmLabel,
    }));
    await notify.ensureCredentials(cfg);
    await runIntegration({
      name: `${cfg.notificationTool}:epics-created`, cfg,
      args: { epics: epicsForNotif },
      live: () => notify.send(cfg, { event: 'epics-created', epics: epicsForNotif }),
    }).catch(() => {});
  }

  // ── Story processing (sequential) ────────────────────────────────────────────
  const storyResults = [];

  for (const story of batch.stories) {
    const { storyId, epicId, title, points } = story;
    const epicPmId     = epicId ? (epicResults[epicId]?.pmId ?? null) : null;

    // Warn when a story references an epicId not declared in the batch epics array
    if (epicId && !epicResults[epicId]) {
      ctx.send(
        `⚠️  Story ${storyId} references epic ${epicId} which was not found in the batch. ` +
        'Story will be saved locally — it will not be linked to an epic in the PM tool.'
      );
    }

    const storyContent = storyBlocks[storyId];

    if (!storyContent) {
      ctx.send(`⚠️  Story ${storyId} content block not found in agent output — skipped.`);
      storyResults.push({ storyId, title, epicId, points, status: 'skipped', error: 'Content block missing' });
      continue;
    }

    // Save locally first (always succeeds regardless of PM status)
    const storiesDir = epicId
      ? path.join(cfg.repoRoot, '.evyasys', 'board', 'epics', epicId, 'stories', storyId)
      : path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
    fs.mkdirSync(storiesDir, { recursive: true });
    const storyPath = path.join(storiesDir, `${storyId}_UserStory.md`);
    fs.writeFileSync(storyPath, storyContent, 'utf8');

    if (cfg.pmTool === 'local') {
      adoMap.save(cfg.repoRoot, { [storyId]: { adoId: null, dir: storiesDir } });
      storyResults.push({ storyId, title, epicId, points, status: 'saved', pmId: null });
      continue;
    }

    // Back-write epic PM ID into story file before syncing
    if (epicId && epicPmId && String(epicPmId) !== String(epicId)) {
      let content = fs.readFileSync(storyPath, 'utf8');
      if (!content.match(new RegExp(`^Epic:\\s*${epicId}\\s*·`, 'm'))) {
        content = content.replace(/^(Epic:\s*\S+).*$/m, `$1 · ${pmLabel} #${epicPmId}`);
        fs.writeFileSync(storyPath, content, 'utf8');
      }
    }

    // PM sync
    const storyResult = await runIntegration({
      name: `${cfg.pmTool}:create-story`, cfg,
      args: { storyId, file: storyPath, epicId: epicPmId },
      live: () => pm.createStory(cfg, { storyId, file: storyPath, epicId: epicPmId }),
    });

    if (storyResult && storyResult.id && !storyResult.error) {
      adoMap.save(cfg.repoRoot, { [storyId]: { adoId: storyResult.id, dir: storiesDir } });

      // Back-write PM story ID badge into markdown
      const badge = `\n\n> **${pmLabel} Work Item:** #${storyResult.id}\n`;
      let content = fs.readFileSync(storyPath, 'utf8');
      if (!content.includes(`${pmLabel} Work Item:`)) {
        content = content.replace(/^(#\s+.+)$/m, `$1${badge}`);
        fs.writeFileSync(storyPath, content, 'utf8');
      }

      storyResults.push({ storyId, title, epicId, points, status: 'synced', pmId: storyResult.id });
    } else {
      adoMap.save(cfg.repoRoot, { [storyId]: { adoId: null, dir: storiesDir } });
      const errMsg = (storyResult && storyResult.error) || 'PM sync failed';
      ctx.send(
        `⚠️  Story ${storyId} saved locally — ${pmLabel} sync failed: ${errMsg}. ` +
        'Will sync to the PM tool automatically when the issue is resolved.'
      );
      storyResults.push({ storyId, title, epicId, points, status: 'sync-failed', pmId: null, error: errMsg });
    }
  }

  // ── Notification B: stories batch table ──────────────────────────────────────
  if (hasNotify) {
    await runIntegration({
      name: `${cfg.notificationTool}:stories-batch-created`, cfg,
      args: { stories: storyResults, projectName: cfg.project.name || '' },
      live: () => notify.send(cfg, {
        event: 'stories-batch-created',
        stories: storyResults,
        projectName: cfg.project.name || '',
      }),
    }).catch(() => {});
  }

  // ── Session summary ───────────────────────────────────────────────────────────
  const synced     = storyResults.filter(s => s.status === 'synced').length;
  const savedLocal = storyResults.filter(s => s.status === 'saved').length;
  const failed     = storyResults.filter(s => s.status === 'sync-failed').length;
  const skipped    = storyResults.filter(s => s.status === 'skipped').length;

  ctx.send(
    `✅ Batch complete — ${storyResults.length} stories across ${batchEpics.length} epic(s).\n` +
    (synced     > 0 ? `  • ${synced} synced to ${pmLabel}\n`                                          : '') +
    (savedLocal > 0 ? `  • ${savedLocal} saved locally (local-only mode)\n`                           : '') +
    (failed     > 0 ? `  ⚠️  ${failed} PM sync failed — saved locally, sync when resolved\n`         : '') +
    (skipped    > 0 ? `  ⚠️  ${skipped} skipped — content block missing, re-run if needed\n`         : '')
  );
};

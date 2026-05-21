/**
 * Post-agent hook for evyasys-create-story.
 *
 * 1. Saves the story to .evyasys/board/epics/{epicId}/stories/{storyId}/
 *    (Falls back to .evyasys/board/stories/{storyId}/ if no Epic is referenced.)
 * 2. If PM tool is not local:
 *    a) Resolves the Epic via map → PM tool search → create if not found.
 *    b) Creates the Story work item and links it to the Epic.
 *    c) Back-writes the PM tool ID into the saved markdown file.
 * 3. Saves Evyasys ID → { adoId, dir } to .ado-map.json for all later hooks.
 * 4. Sends a notification via the configured notification tool.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration }  = require('../../scripts/lib/dryrun');
const { loadConfig }      = require('../../scripts/lib/config');
const adoMap              = require('../../scripts/lib/ado-map');
const pm                  = require('../../scripts/lib/pm-adapter');
const notify              = require('../../scripts/lib/notify-adapter');

function extractEpicId(markdown) {
  const m = markdown.match(/^Epic:\s*([^\s]+)/m);
  return m ? m[1].trim() : null;
}

module.exports = async function (ctx) {
  const cfg   = await loadConfig({ ctx });
  const story = ctx.agentResult || ctx.draft;

  if (!story) {
    ctx.send('No story draft found in context — aborting.');
    return;
  }

  const pmLabel     = pm.toolLabel(cfg);
  const notifyLabel = notify.toolLabel(cfg);
  const notifyPart  = cfg.notificationTool !== 'none' ? ` + notify ${notifyLabel}` : '';

  if (!(await ctx.confirm(`Approve the final story and save it to ${pmLabel}${notifyPart}?`))) {
    ctx.send('Story creation cancelled. Draft preserved in session.');
    return;
  }

  // ── Story ID and Epic ────────────────────────────────────────────────────────
  const storyId = ctx.storyId || `${cfg.project.storyIdPrefix || 'EVYA'}-${Date.now()}`;
  const epicId  = ctx.epicId || extractEpicId(story);

  // ── Save story under .evyasys/board/ hierarchy ──────────────────────────────
  let storiesDir;
  if (ctx.saveFolder) {
    const raw = ctx.saveFolder;
    storiesDir = path.isAbsolute(raw) ? raw : path.join(cfg.repoRoot, raw);
  } else if (epicId) {
    storiesDir = path.join(cfg.repoRoot, '.evyasys', 'board', 'epics', epicId, 'stories', storyId);
  } else {
    storiesDir = path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
  }
  fs.mkdirSync(storiesDir, { recursive: true });
  const storyPath = path.join(storiesDir, `${storyId}_UserStory.md`);
  fs.writeFileSync(storyPath, story, 'utf8');
  const displayPath = epicId
    ? `.evyasys/board/epics/${epicId}/stories/${storyId}/${storyId}_UserStory.md`
    : `.evyasys/board/stories/${storyId}/${storyId}_UserStory.md`;
  ctx.send(`Saved story → ${displayPath}`);

  if (cfg.pmTool === 'local') {
    // Local-only: just save and notify, no PM tool sync.
    adoMap.save(cfg.repoRoot, { [storyId]: { adoId: null, dir: storiesDir } });
    await notify.ensureCredentials(cfg);
    await runIntegration({
      name: `${cfg.notificationTool}:story-created`, cfg, args: { storyId },
      live: () => notify.send(cfg, { event: 'story-created', storyId, file: storyPath }),
    });
    ctx.send(`Story ${storyId} saved locally.`);
    return;
  }

  // ── PM tool sync ─────────────────────────────────────────────────────────────
  await pm.ensureCredentials(cfg);

  // Resolve Epic: local map → PM tool search → create
  let epicPmId = epicId;
  if (epicId && /[^0-9]/.test(String(epicId))) {
    const mappedId = adoMap.lookup(cfg.repoRoot, epicId);
    if (mappedId) {
      epicPmId = mappedId;
      ctx.send(`Using existing Epic ${epicId} (${pmLabel} #${epicPmId}) from local map.`);
    } else {
      const foundId = await runIntegration({
        name: `${cfg.pmTool}:find-epic`, cfg, args: { epicId },
        live: () => pm.findEpic(cfg, { epicId }),
      });
      if (foundId && !foundId.dryRun && !foundId.error) {
        epicPmId = foundId;
        adoMap.save(cfg.repoRoot, { [epicId]: epicPmId });
        ctx.send(`Found existing Epic ${epicId} in ${pmLabel} (ID: ${epicPmId}).`);
      } else {
        const epicResult = await runIntegration({
          name: `${cfg.pmTool}:create-epic`, cfg, args: { epicId },
          live: () => pm.createEpic(cfg, { epicId, title: epicId }),
        });
        if (epicResult && epicResult.id) {
          epicPmId = epicResult.id;
          adoMap.save(cfg.repoRoot, { [epicId]: epicPmId });
          ctx.send(`Created new Epic ${epicId} in ${pmLabel} (ID: ${epicPmId}).`);
        }
      }
    }
  }

  // Back-write Epic PM ID into story file.
  if (epicId && epicPmId && String(epicPmId) !== String(epicId)) {
    let content = fs.readFileSync(storyPath, 'utf8');
    if (!content.match(new RegExp(`^Epic:\\s*${epicId}\\s*·`, 'm'))) {
      content = content.replace(/^(Epic:\s*\S+).*$/m, `$1 · ${pmLabel} #${epicPmId}`);
      fs.writeFileSync(storyPath, content, 'utf8');
    }
  }

  // Create Story in PM tool.
  const storyResult = await runIntegration({
    name: `${cfg.pmTool}:create-story`, cfg,
    args: { storyId, file: storyPath, epicId: epicPmId },
    live: () => pm.createStory(cfg, { storyId, file: storyPath, epicId: epicPmId }),
  });

  if (storyResult && storyResult.id) {
    adoMap.save(cfg.repoRoot, { [storyId]: { adoId: storyResult.id, dir: storiesDir } });

    // Inject PM tool link into the markdown.
    const badge = `\n\n> **${pmLabel} Work Item:** #${storyResult.id}\n`;
    let storyContent = fs.readFileSync(storyPath, 'utf8');
    if (!storyContent.includes(`${pmLabel} Work Item:`)) {
      storyContent = storyContent.replace(/^(#\s+.+)$/m, `$1${badge}`);
      fs.writeFileSync(storyPath, storyContent, 'utf8');
    }

    ctx.send(`Created User Story ${storyId} in ${pmLabel} (ID: #${storyResult.id})`);
  }

  // ── Notification ─────────────────────────────────────────────────────────────
  await notify.ensureCredentials(cfg);
  await runIntegration({
    name: `${cfg.notificationTool}:story-created`, cfg, args: { storyId },
    live: () => notify.send(cfg, { event: 'story-created', storyId, file: storyPath }),
  });

  ctx.send(`Story ${storyId} complete.${epicId ? `  Epic: ${epicId} (${pmLabel} #${epicPmId}).` : ''}`);
};

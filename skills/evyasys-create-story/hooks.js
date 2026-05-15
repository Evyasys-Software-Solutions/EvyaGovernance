/**
 * Post-agent hook for evyasys-create-story.
 *
 * 1. Saves the story to .evyasys/board/epics/{epicId}/stories/{storyId}/
 *    (Falls back to .evyasys/board/stories/{storyId}/ if no Epic is referenced.)
 * 2. Resolves the Epic: check local map → search ADO via WIQL → create if not found.
 * 3. Creates the User Story work item in ADO and links it to the Epic.
 * 4. Back-writes the ADO work item ID into the saved markdown file.
 * 5. Saves Evyasys ID → { adoId, dir } to .ado-map.json so all later hooks
 *    (StartDev, FinishDev, etc.) can locate the story folder without knowing the epic.
 * 6. Posts a Teams notification.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration }                            = require('../../scripts/lib/dryrun');
const { loadConfig, ensurePat, ensureTeamsWebhook } = require('../../scripts/lib/config');
const adoMap                                        = require('../../scripts/lib/ado-map');

/** Extract the Epic ID from the story markdown (looks for a line like "Epic: EP-1001"). */
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

  if (!(await ctx.confirm('Approve the final story and create it in Azure DevOps + notify Teams?'))) {
    ctx.send('Story creation cancelled. Draft preserved in session.');
    return;
  }

  // ── Story ID and Epic ────────────────────────────────────────────────────────
  const storyId = ctx.storyId || `${cfg.project.storyIdPrefix || 'EVYA'}-${Date.now()}`;
  const epicId  = ctx.epicId || extractEpicId(story);

  // ── Save story under .evyasys/board/ hierarchy ──────────────────────────────
  // board/epics/{epicId}/stories/{storyId}/ if an epic is referenced,
  // board/stories/{storyId}/ otherwise.
  // ctx.saveFolder overrides both (advanced use — absolute or repo-relative path).
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

  // ── Azure DevOps ─────────────────────────────────────────────────────────────
  await ensurePat(cfg, ctx);

  // Step 1 — resolve the Epic to a numeric ADO ID using a 3-step find-or-create:
  //   a) Check local .ado-map.json (fast path, no HTTP)
  //   b) Search ADO via WIQL (covers Epics created outside this tool)
  //   c) Create a new Epic only if neither source found it
  // A plain number means the caller already has the ADO ID — skip all checks.
  let epicAdoId = epicId;
  if (epicId && /[^0-9]/.test(String(epicId))) {
    // a) Local map lookup
    const mappedId = adoMap.lookup(cfg.repoRoot, epicId);
    if (mappedId) {
      epicAdoId = mappedId;
      ctx.send(`Using existing Epic ${epicId} (ADO #${epicAdoId}) from local map.`);
    } else {
      // b) Search ADO
      const foundId = await runIntegration({
        name: 'azure-devops:find-epic',
        cfg,
        args: { epicId },
        live: async () =>
          require('../../scripts/integrations/azure_devops').findEpic({ epicId }),
      });
      if (foundId) {
        epicAdoId = foundId;
        adoMap.save(cfg.repoRoot, { [epicId]: epicAdoId });
        ctx.send(`Found existing Epic ${epicId} in Azure DevOps (ADO #${epicAdoId}).`);
      } else {
        // c) Create new Epic
        const epicResult = await runIntegration({
          name: 'azure-devops:create-epic',
          cfg,
          args: { epicId },
          live: async () =>
            require('../../scripts/integrations/azure_devops').createEpic({
              epicId,
              title: epicId,
            }),
        });
        if (epicResult && epicResult.id) {
          epicAdoId = epicResult.id;
          adoMap.save(cfg.repoRoot, { [epicId]: epicAdoId });
          ctx.send(`Created new Epic ${epicId} in Azure DevOps (ADO #${epicAdoId}).`);
        }
      }
    }
  }

  // Back-write the Epic's ADO number into the story file so the local doc
  // references the DevOps work item ID alongside the Evyasys ID.
  // Only runs when epicAdoId is a real numeric ID (i.e. it changed from the
  // Evyasys string like "EP-1001" to a number like 5678).
  if (epicId && epicAdoId && String(epicAdoId) !== String(epicId)) {
    let content = fs.readFileSync(storyPath, 'utf8');
    if (!content.match(new RegExp(`^Epic:\\s*${epicId}\\s*·`, 'm'))) {
      content = content.replace(/^(Epic:\s*\S+).*$/m, `$1 · ADO #${epicAdoId}`);
      fs.writeFileSync(storyPath, content, 'utf8');
    }
  }

  // Step 2 — create User Story and link it to the Epic.
  const storyResult = await runIntegration({
    name: 'azure-devops:create-stories',
    cfg,
    args: { storyId, file: storyPath, epicId: epicAdoId },
    live: async () =>
      require('../../scripts/integrations/azure_devops').createStories({
        storyId,
        file: storyPath,
        epicId: epicAdoId,
      }),
  });

  // Save Evyasys story ID → { adoId, dir } so every later hook can find this
  // story's folder without needing to know which epic it belongs to.
  // Also back-write the ADO ID into the saved markdown so the file is self-documenting.
  if (storyResult && storyResult.id) {
    adoMap.save(cfg.repoRoot, { [storyId]: { adoId: storyResult.id, dir: storiesDir } });

    // Inject the ADO work item link after the first heading.
    const adoUrl = cfg.azure.org && cfg.azure.project
      ? `https://dev.azure.com/${encodeURIComponent(cfg.azure.org)}/${encodeURIComponent(cfg.azure.project)}/_workitems/edit/${storyResult.id}`
      : null;
    const badge = adoUrl
      ? `\n\n> **ADO Work Item:** [#${storyResult.id}](${adoUrl})\n`
      : `\n\n> **ADO Work Item:** #${storyResult.id}\n`;
    let storyContent = fs.readFileSync(storyPath, 'utf8');
    if (!storyContent.includes('ADO Work Item:')) {
      storyContent = storyContent.replace(/^(#\s+.+)$/m, `$1${badge}`);
      fs.writeFileSync(storyPath, storyContent, 'utf8');
    }

    ctx.send(`Created User Story ${storyId} in Azure DevOps (ADO #${storyResult.id})`);
  }

  // ── Teams ─────────────────────────────────────────────────────────────────────
  await ensureTeamsWebhook(cfg, ctx);
  await runIntegration({
    name: 'teams:story-created',
    cfg,
    args: { storyId, file: storyPath },
    live: async () =>
      require('../../scripts/integrations/teams_webhook').storyCreated({
        storyId,
        file: storyPath,
      }),
  });

  ctx.send(`Story ${storyId} complete.${epicId ? `  Epic: ${epicId} (ADO #${epicAdoId}).` : ''}`);
};

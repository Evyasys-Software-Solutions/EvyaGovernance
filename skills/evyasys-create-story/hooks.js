/**
 * Post-agent hook for evyasys-create-story.
 *
 * 1. Saves the story to the user-specified folder (default: docs/stories/).
 * 2. If the story references an Epic, also saves a reference copy under docs/epics/<epicId>/.
 * 3. Creates the ADO User Story work item and links it to the epic if one is present.
 * 4. Posts a Teams notification.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration }                          = require('../../scripts/lib/dryrun');
const { loadConfig, ensurePat, ensureTeamsWebhook } = require('../../scripts/lib/config');

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

  // ── Story ID ────────────────────────────────────────────────────────────────
  const storyId = ctx.storyId || `${cfg.project.storyIdPrefix || 'EVYA'}-${Date.now()}`;

  // ── Save folder (user-specified or default) ─────────────────────────────────
  const rawFolder = ctx.saveFolder || null;
  const storiesDir = rawFolder
    ? (path.isAbsolute(rawFolder) ? rawFolder : path.join(cfg.repoRoot, rawFolder))
    : path.join(cfg.repoRoot, 'docs', 'stories');
  fs.mkdirSync(storiesDir, { recursive: true });
  const storyPath = path.join(storiesDir, `${storyId}_UserStory.md`);
  fs.writeFileSync(storyPath, story, 'utf8');
  ctx.send(`Saved story → ${storyPath}`);

  // ── Epic reference copy ─────────────────────────────────────────────────────
  const epicId = ctx.epicId || extractEpicId(story);
  if (epicId) {
    const epicsDir = path.join(cfg.repoRoot, 'docs', 'epics', epicId);
    fs.mkdirSync(epicsDir, { recursive: true });
    const epicRefPath = path.join(epicsDir, `${storyId}_UserStory.md`);
    fs.writeFileSync(epicRefPath, story, 'utf8');
    ctx.send(`Epic reference copy saved → ${epicRefPath}`);
  }

  // ── Azure DevOps ─────────────────────────────────────────────────────────────
  await ensurePat(cfg, ctx);
  await runIntegration({
    name: 'azure-devops:create-story',
    cfg,
    args: { storyId, file: storyPath, epicId },
    live: async () =>
      require('../../scripts/integrations/azure_devops').createStory({
        storyId,
        file: storyPath,
        epicId,
      }),
  });

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

  ctx.send(`Story ${storyId} complete.${epicId ? `  Epic: ${epicId}.` : ''}`);
};

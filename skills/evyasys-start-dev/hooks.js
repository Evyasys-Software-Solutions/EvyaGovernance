/**
 * Post-agent hook for evyasys-start-dev.
 *
 * Batch mode (EVYASTARTDEVBATCH manifest present):
 *   Accepts epic IDs or multiple story IDs. Single confirmation gate covers all.
 *   For each story: save brainstorm → PM "In Progress" → notify dev-kickoff immediately.
 *
 * Single-story fallback (no manifest):
 *   Original behaviour — ctx.args[0] as storyId, ctx.agentResult as brainstorm.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration } = require('../../scripts/lib/dryrun');
const { loadConfig }     = require('../../scripts/lib/config');
const adoMap             = require('../../scripts/lib/ado-map');
const pm                 = require('../../scripts/lib/pm-adapter');
const notify             = require('../../scripts/lib/notify-adapter');

function parseBatchManifest(text, tag) {
  const m = text && text.match(new RegExp(`<!--\\s*${tag}\\s*([\\s\\S]*?)-->`, 'i'));
  if (!m) return null;
  try { return JSON.parse(m[1].trim()); } catch { return null; }
}

function parseContentBlocks(text, tag) {
  const out     = {};
  const startRe = new RegExp(`=== ${tag}: ([\\w-]+) ===`, 'g');
  let sm;
  while ((sm = startRe.exec(text)) !== null) {
    const id     = sm[1];
    const after  = text.slice(sm.index + sm[0].length);
    const endTag = `=== END_${tag}: ${id} ===`;
    const endIdx = after.indexOf('\n' + endTag);
    if (endIdx !== -1) out[id] = after.slice(1, endIdx);
  }
  return out;
}

module.exports = async function (ctx) {
  const cfg    = await loadConfig({ ctx });
  const output = ctx.agentResult || '';

  const pmLabel     = pm.toolLabel(cfg);
  const notifyLabel = notify.toolLabel(cfg);
  const hasNotify   = cfg.notificationTool !== 'none';
  const notifyPart  = hasNotify ? ` and notify ${notifyLabel}` : '';

  // ── Batch mode ─────────────────────────────────────────────────────────────────
  const batch = parseBatchManifest(output, 'EVYASTARTDEVBATCH');

  if (batch && Array.isArray(batch.stories) && batch.stories.length > 0) {
    const blocks = parseContentBlocks(output, 'EVYA_BRAINSTORM');
    const count  = batch.stories.length;

    if (!(await ctx.confirm(
      `Set ${count} stor${count !== 1 ? 'ies' : 'y'} to "In Progress" in ${pmLabel}${notifyPart}?\n  ${batch.stories.map(s => s.storyId).join(', ')}`
    ))) {
      ctx.send('Cancelled — state transitions and notifications not sent.');
      return;
    }

    if (cfg.pmTool !== 'local') await pm.ensureCredentials(cfg);
    if (hasNotify)               await notify.ensureCredentials(cfg);

    for (const story of batch.stories) {
      const { storyId } = story;
      const brainstorm  = blocks[storyId];

      if (!brainstorm) {
        ctx.send(`⚠️  Brainstorm block for ${storyId} not found in agent output — skipped.`);
        continue;
      }

      const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
        || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
      fs.mkdirSync(storyDir, { recursive: true });
      const brainstormPath = path.join(storyDir, `${storyId}_TechBrainstorm.md`);
      fs.writeFileSync(brainstormPath, brainstorm, 'utf8');
      ctx.send(`Saved tech brainstorm → ${brainstormPath}`);

      if (cfg.pmTool !== 'local') {
        const pmStoryId = adoMap.lookup(cfg.repoRoot, storyId);
        if (!pmStoryId && !cfg.dryRun) {
          ctx.send(`⚠️  ${pmLabel} ID for ${storyId} not found — state change may target wrong item.`);
        }
        const idForPm = pmStoryId || storyId;
        await runIntegration({
          name: `${cfg.pmTool}:set-state(In Progress) [#${idForPm}]`, cfg,
          args: { storyId: idForPm, state: 'In Progress' },
          live: () => pm.setState(cfg, { storyId: idForPm, state: 'In Progress' }),
        });
      }

      if (hasNotify) {
        await runIntegration({
          name: `${cfg.notificationTool}:dev-kickoff`, cfg,
          args: { storyId },
          live: () => notify.send(cfg, { event: 'dev-kickoff', storyId }),
        });
      }

      const pmDetail    = cfg.pmTool !== 'local'
        ? ` (${pmLabel} #${adoMap.lookup(cfg.repoRoot, storyId) || storyId})`
        : '';
      const notifyNote  = hasNotify ? ' Kickoff notification sent.' : '';
      ctx.send(`${storyId} is now In Progress${pmDetail}.${notifyNote}`);
    }
    return;
  }

  // ── Single-story fallback (original behaviour) ─────────────────────────────────
  const storyId = ctx.args && ctx.args[0];
  if (!storyId) {
    ctx.send('Missing StoryID. Usage: /evyasys:StartDev <StoryID|EpicID> [...]');
    return;
  }

  const brainstorm = ctx.brainstorm || output;
  if (brainstorm) {
    const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
      || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
    fs.mkdirSync(storyDir, { recursive: true });
    const brainstormPath = path.join(storyDir, `${storyId}_TechBrainstorm.md`);
    fs.writeFileSync(brainstormPath, brainstorm, 'utf8');
    ctx.send(`Saved tech brainstorm → ${brainstormPath}`);
  }

  if (!(await ctx.confirm(`Set ${storyId} to "In Progress" in ${pmLabel}${notifyPart}?`))) {
    ctx.send('Cancelled — state transition and notification not sent.');
    return;
  }

  if (cfg.pmTool !== 'local') {
    const pmStoryId = adoMap.lookup(cfg.repoRoot, storyId);
    if (!pmStoryId && !cfg.dryRun) {
      ctx.send(`Warning: ${pmLabel} ID for ${storyId} not found in map — state change may target the wrong item.`);
    }
    const idForPm = pmStoryId || storyId;
    await pm.ensureCredentials(cfg);
    await runIntegration({
      name: `${cfg.pmTool}:set-state(In Progress) [#${idForPm}]`, cfg,
      args: { storyId: idForPm, state: 'In Progress' },
      live: () => pm.setState(cfg, { storyId: idForPm, state: 'In Progress' }),
    });
  }

  await notify.ensureCredentials(cfg);
  await runIntegration({
    name: `${cfg.notificationTool}:dev-kickoff`, cfg,
    args: { storyId },
    live: () => notify.send(cfg, { event: 'dev-kickoff', storyId }),
  });

  const pmDetail = cfg.pmTool !== 'local'
    ? ` (${pmLabel} #${adoMap.lookup(cfg.repoRoot, storyId) || storyId})`
    : '';
  ctx.send(`${storyId} is now In Progress${pmDetail}. Kickoff notification sent.`);
};

/**
 * Post-agent hook for evyasys-start-qa.
 *
 * Batch mode (EVYASTARTQABATCH manifest present):
 *   Accepts epic IDs or multiple story IDs. Single confirmation gate covers all.
 *   For each story: save test plan → PM "In QA" → notify qa-started immediately.
 *
 * Single-story fallback (no manifest):
 *   Original behaviour — ctx.args[0] as storyId, ctx.agentResult as test plan.
 */
const path = require('path');
const fs   = require('fs');
const { runIntegration } = require('../../scripts/lib/dryrun');
const { loadConfig }     = require('../../scripts/lib/config');
const adoMap             = require('../../scripts/lib/ado-map');
const pm                 = require('../../scripts/lib/pm-adapter');
const notify             = require('../../scripts/lib/notify-adapter');
const pw                 = require('../../scripts/lib/playwright-manager');

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
  const batch = parseBatchManifest(output, 'EVYASTARTQABATCH');

  if (batch && Array.isArray(batch.stories) && batch.stories.length > 0) {
    const blocks = parseContentBlocks(output, 'EVYA_TESTPLAN');
    const count  = batch.stories.length;

    if (!(await ctx.confirm(
      `Set ${count} stor${count !== 1 ? 'ies' : 'y'} to "In QA" in ${pmLabel}${notifyPart}?\n  ${batch.stories.map(s => s.storyId).join(', ')}`
    ))) {
      ctx.send('Cancelled — state transitions and notifications not sent.');
      return;
    }

    if (cfg.pmTool !== 'local') await pm.ensureCredentials(cfg);
    if (hasNotify)               await notify.ensureCredentials(cfg);

    for (const story of batch.stories) {
      const { storyId } = story;
      const plan        = blocks[storyId];

      if (!plan) {
        ctx.send(`⚠️  Test plan block for ${storyId} not found in agent output — skipped.`);
        continue;
      }

      const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
        || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
      fs.mkdirSync(storyDir, { recursive: true });
      const out = path.join(storyDir, `${storyId}_TestPlan.md`);
      fs.writeFileSync(out, plan, 'utf8');
      ctx.send(`Saved test plan → ${out}`);

      if (cfg.pmTool !== 'local') {
        const pmStoryId = adoMap.lookup(cfg.repoRoot, storyId);
        if (!pmStoryId && !cfg.dryRun) {
          ctx.send(`⚠️  ${pmLabel} ID for ${storyId} not found — state change may target wrong item.`);
        }
        const idForPm = pmStoryId || storyId;
        await runIntegration({
          name: `${cfg.pmTool}:set-state(In QA) [#${idForPm}]`, cfg,
          args: { storyId: idForPm, state: 'In QA' },
          live: () => pm.setState(cfg, { storyId: idForPm, state: 'In QA' }),
        });
      }

      if (hasNotify) {
        await runIntegration({
          name: `${cfg.notificationTool}:qa-started`, cfg,
          args: { storyId },
          live: () => notify.send(cfg, { event: 'qa-started', storyId }),
        });
      }

      const pmDetail  = cfg.pmTool !== 'local'
        ? ` (${pmLabel} #${adoMap.lookup(cfg.repoRoot, storyId) || storyId})`
        : '';
      const passedTcs = pw.loadPassedTests(cfg.repoRoot, storyId);
      const skipNote  = passedTcs.length > 0
        ? ` ${passedTcs.length} TC${passedTcs.length !== 1 ? 's' : ''} already passed (${passedTcs.map(t => t.id).join(', ')}) — marked skip in spec.`
        : '';
      const notifyNote = hasNotify ? ' QA notification sent.' : '';
      ctx.send(`${storyId} is now In QA${pmDetail}.${notifyNote}${skipNote}`);
    }
    return;
  }

  // ── Single-story fallback (original behaviour) ─────────────────────────────────
  const storyId = ctx.args && ctx.args[0];
  if (!storyId) {
    ctx.send('Missing StoryID. Usage: /evyasys:StartQa <StoryID|EpicID> [...]');
    return;
  }

  const plan = output;
  if (plan) {
    const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
      || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
    fs.mkdirSync(storyDir, { recursive: true });
    const out = path.join(storyDir, `${storyId}_TestPlan.md`);
    fs.writeFileSync(out, plan, 'utf8');
    ctx.send(`Saved test plan → ${out}`);
  }

  if (!(await ctx.confirm(`Set ${storyId} to "In QA" in ${pmLabel}${notifyPart}?`))) {
    ctx.send('Cancelled.'); return;
  }

  if (cfg.pmTool !== 'local') {
    const pmStoryId = adoMap.lookup(cfg.repoRoot, storyId);
    if (!pmStoryId && !cfg.dryRun) {
      ctx.send(`Warning: ${pmLabel} ID for ${storyId} not found in map — state change may target the wrong item.`);
    }
    const idForPm = pmStoryId || storyId;
    await pm.ensureCredentials(cfg);
    await runIntegration({
      name: `${cfg.pmTool}:set-state(In QA) [#${idForPm}]`, cfg,
      args: { storyId: idForPm, state: 'In QA' },
      live: () => pm.setState(cfg, { storyId: idForPm, state: 'In QA' }),
    });
  }

  await notify.ensureCredentials(cfg);
  await runIntegration({
    name: `${cfg.notificationTool}:qa-started`, cfg,
    args: { storyId },
    live: () => notify.send(cfg, { event: 'qa-started', storyId }),
  });

  const pmDetail = cfg.pmTool !== 'local'
    ? ` (${pmLabel} #${adoMap.lookup(cfg.repoRoot, storyId) || storyId})`
    : '';
  const passedTcs = pw.loadPassedTests(cfg.repoRoot, storyId);
  const skipNote  = passedTcs.length > 0
    ? ` ${passedTcs.length} TC${passedTcs.length !== 1 ? 's' : ''} already passed from previous run (${passedTcs.map(t => t.id).join(', ')}) — marked skip in spec.`
    : '';
  ctx.send(`${storyId} is now In QA${pmDetail}. QA notification sent.${skipNote}`);
};

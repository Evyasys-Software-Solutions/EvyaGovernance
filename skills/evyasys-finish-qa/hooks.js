/**
 * Post-agent hook for evyasys-finish-qa.
 *
 * 1. Parses EVYABUGS and EVYATCRESULTS blocks from agent output.
 * 2. Saves clean release notes (blocks stripped).
 * 3. Creates bug work items in PM tool for each found bug.
 * 4. Updates the Playwright spec with TC outcomes.
 * 5. Conditionally marks Done:
 *      - P1/P2 (severity 1–2) bugs → story stays In QA, notification = bug-found
 *      - P3/P4 bugs only OR no bugs → story → Done, notification = qa-finished (+ bug-found if bugs)
 * 6. Sends appropriate notifications.
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

  if (!storyId) { ctx.send('Missing StoryID. Usage: /evyasys:FinishQa <StoryID>'); return; }

  const rawOutput = ctx.agentResult;

  // Parse structured blocks from agent output.
  const { bugs,     cleanedOutput: afterBugs }    = pw.parseBugsBlock(rawOutput || '');
  const { outcomes, cleanedOutput: cleanNotes }   = pw.parseResultsBlock(afterBugs || rawOutput || '');
  const notes = cleanNotes || rawOutput;

  // Save clean release notes (no embedded JSON blocks).
  if (notes) {
    const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
      || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
    fs.mkdirSync(storyDir, { recursive: true });
    const out = path.join(storyDir, `${storyId}_ReleaseNotes.md`);
    fs.writeFileSync(out, notes, 'utf8');
    ctx.send(`Saved release notes → ${out}`);
  }

  // Update Playwright spec with test outcomes.
  if (Array.isArray(outcomes) && outcomes.length > 0) {
    pw.updateOutcomes(cfg.repoRoot, storyId, outcomes);
    const passedCount = outcomes.filter(o => o.status === 'PASSED').length;
    const failedCount = outcomes.filter(o => o.status !== 'PASSED').length;
    ctx.send(`Playwright spec updated: ${passedCount} passed, ${failedCount} failed/skipped.`);
  }

  // Determine if critical/high bugs block release.
  const bugList        = Array.isArray(bugs) ? bugs : [];
  const criticalBugs   = bugList.filter(b => b.severity <= 2);  // P1 = Critical, P2 = High
  const hasBlockers    = criticalBugs.length > 0;
  const storyPmId      = adoMap.lookup(cfg.repoRoot, storyId);

  const pmLabel     = pm.toolLabel(cfg);
  const notifyLabel = notify.toolLabel(cfg);
  const notifyPart  = cfg.notificationTool !== 'none' ? ` and notify ${notifyLabel}` : '';

  // Confirmation message differs based on whether bugs block release.
  const stateAction = hasBlockers
    ? `Keep ${storyId} "In QA" (${criticalBugs.length} blocking bug${criticalBugs.length !== 1 ? 's' : ''} found)`
    : `Set ${storyId} to "Done"`;
  const bugAction = bugList.length > 0
    ? ` + create ${bugList.length} bug${bugList.length !== 1 ? 's' : ''} in ${pmLabel}`
    : '';

  if (!(await ctx.confirm(`${stateAction}${bugAction}${notifyPart}?`))) {
    ctx.send('Cancelled.'); return;
  }

  // Create bug work items in PM tool.
  const createdBugs = [];
  if (bugList.length > 0 && cfg.pmTool !== 'local') {
    await pm.ensureCredentials(cfg);
    for (const bug of bugList) {
      const result = await runIntegration({
        name: `${cfg.pmTool}:create-bug [${bug.title}]`, cfg,
        args: { storyId, storyPmId, ...bug },
        live: () => pm.createBug(cfg, { storyId, storyPmId, ...bug }),
      });
      if (result && result.id) {
        createdBugs.push({ ...bug, pmId: result.id });
        ctx.send(`Bug created: "${bug.title}" → ${pmLabel} #${result.id} (severity ${bug.severity})`);
      } else if (result && result.error) {
        ctx.send(`⚠️  Bug "${bug.title}" failed to sync to ${pmLabel}: ${result.error}`);
      }
    }
  } else if (bugList.length > 0) {
    ctx.send(`${bugList.length} bug${bugList.length !== 1 ? 's' : ''} recorded (local mode — no PM tool sync).`);
  }

  // State transition.
  if (!hasBlockers && cfg.pmTool !== 'local') {
    const idForPm = storyPmId || storyId;
    if (!storyPmId && !cfg.dryRun) {
      ctx.send(`Warning: ${pmLabel} ID for ${storyId} not found in map — state change may target the wrong item.`);
    }
    await pm.ensureCredentials(cfg);
    await runIntegration({
      name: `${cfg.pmTool}:set-state(Done) [#${idForPm}]`, cfg,
      args: { storyId: idForPm, state: 'Done' },
      live: () => pm.setState(cfg, { storyId: idForPm, state: 'Done' }),
    });
  }

  // Notifications.
  await notify.ensureCredentials(cfg);

  if (bugList.length > 0) {
    await runIntegration({
      name: `${cfg.notificationTool}:bug-found`, cfg,
      args: { storyId, count: bugList.length, criticalCount: criticalBugs.length },
      live: () => notify.send(cfg, {
        event: 'bug-found', storyId,
        count: bugList.length,
        criticalCount: criticalBugs.length || undefined,
      }),
    });
  }

  if (!hasBlockers) {
    await runIntegration({
      name: `${cfg.notificationTool}:qa-finished`, cfg,
      args: { storyId },
      live: () => notify.send(cfg, { event: 'qa-finished', storyId }),
    });
  }

  const pmDetail = cfg.pmTool !== 'local'
    ? ` (${pmLabel} #${storyPmId || storyId})`
    : '';
  const statusMsg = hasBlockers
    ? `${storyId} remains In QA${pmDetail} — ${criticalBugs.length} blocking bug${criticalBugs.length !== 1 ? 's' : ''} require fixes. Bug notification sent.`
    : `${storyId} is Done${pmDetail}. Release notification sent.${bugList.length > 0 ? ` ${bugList.length} bug${bugList.length !== 1 ? 's' : ''} (low severity) created in ${pmLabel}.` : ''}`;
  ctx.send(statusMsg);
};

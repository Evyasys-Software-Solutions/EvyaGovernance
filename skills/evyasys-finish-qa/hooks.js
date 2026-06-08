/**
 * Post-agent hook for evyasys-finish-qa.
 *
 * Batch mode (EVYAFINISHQABATCH manifest present):
 *   Accepts epic IDs or multiple story IDs. Single confirmation gate covers all.
 *   Per-story blocks use storyId-qualified tags:
 *     Release notes : === EVYA_RELEASENOTES: {id} === / === END_EVYA_RELEASENOTES: {id} ===
 *     TC results    : <!-- EVYATCRESULTS:{id} [...] -->
 *     Bugs          : <!-- EVYABUGS:{id} [...] -->
 *   For each story: save release notes → update Playwright outcomes → create bugs in PM
 *                   → PM state transition → notify immediately.
 *
 * Single-story fallback (no manifest):
 *   Original behaviour — ctx.args[0] as storyId.
 *   Unqualified EVYABUGS and EVYATCRESULTS blocks parsed from ctx.agentResult.
 *
 * P1/P2 bugs block release: story stays In QA, sends bug-found notification.
 * P3/P4 only or no bugs: story → Done, sends qa-finished (+ bug-found if bugs).
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

function parseQualifiedJsonBlock(text, tag, storyId) {
  const re = new RegExp(`<!--\\s*${tag}:${storyId}\\s*([\\s\\S]*?)-->`, 'i');
  const m  = text.match(re);
  if (!m) return null;
  try { return JSON.parse(m[1].trim()); } catch { return null; }
}

module.exports = async function (ctx) {
  const cfg       = await loadConfig({ ctx });
  const output    = ctx.agentResult || '';
  const pmLabel   = pm.toolLabel(cfg);
  const hasNotify = cfg.notificationTool !== 'none';

  // ── Batch mode ─────────────────────────────────────────────────────────────────
  const batch = parseBatchManifest(output, 'EVYAFINISHQABATCH');

  if (batch && Array.isArray(batch.stories) && batch.stories.length > 0) {
    const releaseBlocks = parseContentBlocks(output, 'EVYA_RELEASENOTES');
    const count         = batch.stories.length;

    // Pre-flight: determine if any story has blocking bugs so the confirm message is accurate
    const storyBugSummaries = batch.stories.map(s => {
      const bugs        = parseQualifiedJsonBlock(output, 'EVYABUGS', s.storyId) || [];
      const criticals   = (Array.isArray(bugs) ? bugs : []).filter(b => b.severity <= 2);
      return { storyId: s.storyId, bugCount: bugs.length, criticalCount: criticals.length };
    });
    const totalBugs     = storyBugSummaries.reduce((n, s) => n + s.bugCount, 0);
    const totalCritical = storyBugSummaries.reduce((n, s) => n + s.criticalCount, 0);
    const bugLine       = totalBugs > 0 ? ` + create ${totalBugs} bug${totalBugs !== 1 ? 's' : ''} in ${pmLabel}` : '';
    const blockerLine   = totalCritical > 0 ? ` (${totalCritical} blocking — those stories stay In QA)` : '';

    const notifyLabel = notify.toolLabel(cfg);
    const notifyPart  = hasNotify ? ` and notify ${notifyLabel}` : '';

    if (!(await ctx.confirm(
      `Finalise QA for ${count} stor${count !== 1 ? 'ies' : 'y'}${bugLine}${blockerLine}${notifyPart}?\n  ${batch.stories.map(s => s.storyId).join(', ')}`
    ))) {
      ctx.send('Cancelled.'); return;
    }

    if (cfg.pmTool !== 'local') await pm.ensureCredentials(cfg);
    if (hasNotify)               await notify.ensureCredentials(cfg);

    for (const story of batch.stories) {
      const { storyId } = story;

      // Release notes
      const notes = releaseBlocks[storyId];
      if (notes) {
        const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
          || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
        fs.mkdirSync(storyDir, { recursive: true });
        const out = path.join(storyDir, `${storyId}_ReleaseNotes.md`);
        fs.writeFileSync(out, notes, 'utf8');
        ctx.send(`Saved release notes → ${out}`);
      } else {
        ctx.send(`⚠️  Release notes block for ${storyId} not found — notes not saved.`);
      }

      // TC outcomes
      const outcomes = parseQualifiedJsonBlock(output, 'EVYATCRESULTS', storyId);
      if (Array.isArray(outcomes) && outcomes.length > 0) {
        pw.updateOutcomes(cfg.repoRoot, storyId, outcomes);
        const passedCount = outcomes.filter(o => o.status === 'PASSED').length;
        const failedCount = outcomes.filter(o => o.status !== 'PASSED').length;
        ctx.send(`${storyId} — Playwright spec updated: ${passedCount} passed, ${failedCount} failed/skipped.`);
      }

      // Bugs
      const bugList      = parseQualifiedJsonBlock(output, 'EVYABUGS', storyId) || [];
      const bugs         = Array.isArray(bugList) ? bugList : [];
      const criticalBugs = bugs.filter(b => b.severity <= 2);
      const hasBlockers  = criticalBugs.length > 0;
      const storyPmId    = adoMap.lookup(cfg.repoRoot, storyId);

      const createdBugs = [];
      if (bugs.length > 0 && cfg.pmTool !== 'local') {
        for (const bug of bugs) {
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
      } else if (bugs.length > 0) {
        ctx.send(`${bugs.length} bug${bugs.length !== 1 ? 's' : ''} recorded for ${storyId} (local mode — no PM tool sync).`);
      }

      // State transition
      if (!hasBlockers && cfg.pmTool !== 'local') {
        const idForPm = storyPmId || storyId;
        if (!storyPmId && !cfg.dryRun) {
          ctx.send(`⚠️  ${pmLabel} ID for ${storyId} not found — state change may target wrong item.`);
        }
        await runIntegration({
          name: `${cfg.pmTool}:set-state(Done) [#${idForPm}]`, cfg,
          args: { storyId: idForPm, state: 'Done' },
          live: () => pm.setState(cfg, { storyId: idForPm, state: 'Done' }),
        });
      }

      // Notifications
      if (hasNotify) {
        if (bugs.length > 0) {
          await runIntegration({
            name: `${cfg.notificationTool}:bug-found`, cfg,
            args: { storyId, count: bugs.length, criticalCount: criticalBugs.length },
            live: () => notify.send(cfg, {
              event: 'bug-found', storyId,
              count: bugs.length,
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
      }

      const pmDetail = cfg.pmTool !== 'local' ? ` (${pmLabel} #${storyPmId || storyId})` : '';
      const statusMsg = hasBlockers
        ? `${storyId} remains In QA${pmDetail} — ${criticalBugs.length} blocking bug${criticalBugs.length !== 1 ? 's' : ''} require fixes.`
        : `${storyId} is Done${pmDetail}.${bugs.length > 0 ? ` ${bugs.length} bug${bugs.length !== 1 ? 's' : ''} (low severity) created in ${pmLabel}.` : ''}`;
      ctx.send(statusMsg);
    }
    return;
  }

  // ── Single-story fallback (original behaviour) ─────────────────────────────────
  const storyId = ctx.args && ctx.args[0];
  if (!storyId) { ctx.send('Missing StoryID. Usage: /evyasys:FinishQa <StoryID|EpicID> [...]'); return; }

  const rawOutput = output;

  const { bugs,     cleanedOutput: afterBugs }  = pw.parseBugsBlock(rawOutput);
  const { outcomes, cleanedOutput: cleanNotes } = pw.parseResultsBlock(afterBugs || rawOutput);
  const notes = cleanNotes || rawOutput;

  if (notes) {
    const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
      || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
    fs.mkdirSync(storyDir, { recursive: true });
    const out = path.join(storyDir, `${storyId}_ReleaseNotes.md`);
    fs.writeFileSync(out, notes, 'utf8');
    ctx.send(`Saved release notes → ${out}`);
  }

  if (Array.isArray(outcomes) && outcomes.length > 0) {
    pw.updateOutcomes(cfg.repoRoot, storyId, outcomes);
    const passedCount = outcomes.filter(o => o.status === 'PASSED').length;
    const failedCount = outcomes.filter(o => o.status !== 'PASSED').length;
    ctx.send(`Playwright spec updated: ${passedCount} passed, ${failedCount} failed/skipped.`);
  }

  const bugList      = Array.isArray(bugs) ? bugs : [];
  const criticalBugs = bugList.filter(b => b.severity <= 2);
  const hasBlockers  = criticalBugs.length > 0;
  const storyPmId    = adoMap.lookup(cfg.repoRoot, storyId);

  const notifyLabel = notify.toolLabel(cfg);
  const notifyPart  = cfg.notificationTool !== 'none' ? ` and notify ${notifyLabel}` : '';

  const stateAction = hasBlockers
    ? `Keep ${storyId} "In QA" (${criticalBugs.length} blocking bug${criticalBugs.length !== 1 ? 's' : ''} found)`
    : `Set ${storyId} to "Done"`;
  const bugAction = bugList.length > 0
    ? ` + create ${bugList.length} bug${bugList.length !== 1 ? 's' : ''} in ${pmLabel}`
    : '';

  if (!(await ctx.confirm(`${stateAction}${bugAction}${notifyPart}?`))) {
    ctx.send('Cancelled.'); return;
  }

  if (bugList.length > 0 && cfg.pmTool !== 'local') {
    await pm.ensureCredentials(cfg);
    for (const bug of bugList) {
      const result = await runIntegration({
        name: `${cfg.pmTool}:create-bug [${bug.title}]`, cfg,
        args: { storyId, storyPmId, ...bug },
        live: () => pm.createBug(cfg, { storyId, storyPmId, ...bug }),
      });
      if (result && result.id) {
        ctx.send(`Bug created: "${bug.title}" → ${pmLabel} #${result.id} (severity ${bug.severity})`);
      } else if (result && result.error) {
        ctx.send(`⚠️  Bug "${bug.title}" failed to sync to ${pmLabel}: ${result.error}`);
      }
    }
  } else if (bugList.length > 0) {
    ctx.send(`${bugList.length} bug${bugList.length !== 1 ? 's' : ''} recorded (local mode — no PM tool sync).`);
  }

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

  const pmDetail = cfg.pmTool !== 'local' ? ` (${pmLabel} #${storyPmId || storyId})` : '';
  const statusMsg = hasBlockers
    ? `${storyId} remains In QA${pmDetail} — ${criticalBugs.length} blocking bug${criticalBugs.length !== 1 ? 's' : ''} require fixes. Bug notification sent.`
    : `${storyId} is Done${pmDetail}. Release notification sent.${bugList.length > 0 ? ` ${bugList.length} bug${bugList.length !== 1 ? 's' : ''} (low severity) created in ${pmLabel}.` : ''}`;
  ctx.send(statusMsg);
};

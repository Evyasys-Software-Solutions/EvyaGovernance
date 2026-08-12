/**
 * Post-agent hook for evyasys-deliver.
 *
 * End-to-end delivery: parses the agent's per-story artefact blocks and does
 * the mechanical work — writes 4 artefact files (TechBrainstorm, DevSummary,
 * CodeReview, TestPlan), transitions PM state to Ready for QA, fires one
 * notification per story (or per epic in epic mode), records traceability,
 * regenerates CONTEXT.md.
 *
 * Git operations are OFF BY DEFAULT. The agent writes source code to the
 * working tree; the developer commits and pushes themselves.
 *
 * If the manifest sets `commitEnabled: true` (set by the workflow when the
 * user passed `--commit` in $ARGUMENTS), the hook additionally:
 *   · ensures the feature branch exists (creating from the auto-detected
 *     default branch — main/master/origin-HEAD — if not)
 *   · stages only the paths in `filesChanged` (validated for safety)
 *   · creates a local commit via `git commit -F <tmpfile>` using the
 *     agent-supplied `commitMessage`
 * Never pushes.
 */
const path            = require('path');
const fs              = require('fs');
const { execSync }    = require('child_process');
const { runIntegration } = require('../../scripts/lib/dryrun');
const { loadConfig }     = require('../../scripts/lib/config');
const adoMap             = require('../../scripts/lib/ado-map');
const pm                 = require('../../scripts/lib/pm-adapter');
const notify             = require('../../scripts/lib/notify-adapter');
const traceability       = require('../../scripts/lib/traceability');
const contextDoc         = require('../../scripts/lib/context-doc');

// ── Parsing helpers ─────────────────────────────────────────────────────────────

/**
 * Parse `<!-- EVYADELIVER: STORYID { json } -->` blocks. Returns an array of
 * per-story artefact objects, in emission order.
 *
 * The delimiter storyId is the authoritative one. If the JSON body's storyId
 * differs (e.g. the agent copy-pasted a template), we log a mismatch and use
 * the delimiter — the rest of the block is trusted but attributed to the
 * delimiter's ID so that PM updates and commits go to the right story.
 */
function parseArtefactBlocks(text) {
  const out    = [];
  const warnings = [];
  const regex  = /<!--\s*EVYADELIVER:\s*([\w-]+)\s*([\s\S]*?)-->/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const delimiterId = m[1];
    try {
      const parsed = JSON.parse(m[2].trim());
      if (parsed.storyId && parsed.storyId !== delimiterId) {
        warnings.push(
          `${delimiterId}: JSON body has storyId="${parsed.storyId}" — ` +
          `using delimiter ID for safety (PM update goes to ${delimiterId})`
        );
      }
      parsed.storyId = delimiterId;
      out.push(parsed);
    } catch (err) {
      out.push({ storyId: delimiterId, _parseError: err.message });
    }
  }
  return { stories: out, warnings };
}

function parseBatchManifest(text) {
  const m = text && text.match(/<!--\s*EVYADELIVERBATCH\s*([\s\S]*?)-->/);
  if (!m) return null;
  try { return JSON.parse(m[1].trim()); } catch { return null; }
}

// ── Git helpers ─────────────────────────────────────────────────────────────────

function git(cmd, opts = {}) {
  return execSync(`git ${cmd}`, { encoding: 'utf8', ...opts }).trim();
}

function gitSafe(cmd, opts = {}) {
  try { return { ok: true, out: git(cmd, opts) }; }
  catch (err) { return { ok: false, err: err.stderr ? err.stderr.toString() : err.message }; }
}

/**
 * Detect the repo's default branch. Tries in order:
 *   1. `origin/HEAD` symbolic ref (set by `git clone`)
 *   2. Presence of `main`
 *   3. Presence of `master`
 * Returns the branch name, or `null` if none of the above is found.
 */
function detectDefaultBranch(repoRoot) {
  const cwd = { cwd: repoRoot };
  const head = gitSafe('symbolic-ref refs/remotes/origin/HEAD', cwd);
  if (head.ok) {
    const m = head.out.match(/refs\/remotes\/origin\/(.+)$/);
    if (m) return m[1].trim();
  }
  for (const candidate of ['main', 'master']) {
    const r = gitSafe(`rev-parse --verify "${candidate}"`, cwd);
    if (r.ok) return candidate;
  }
  return null;
}

/**
 * Ensure the target feature branch exists locally; create from base if not.
 * Auto-detects base branch (main / master / origin/HEAD) if none supplied.
 * Returns { branch, created, base, error? }.
 */
function ensureFeatureBranch(repoRoot, branchName, base = null) {
  const cwd = { cwd: repoRoot };
  const resolvedBase = base || detectDefaultBranch(repoRoot);
  if (!resolvedBase) {
    return {
      branch: branchName,
      created: false,
      error: 'Cannot determine default branch (checked origin/HEAD, main, master). Set base explicitly.',
    };
  }

  const list = gitSafe(`branch --list "${branchName}"`, cwd);
  if (list.ok && list.out.trim().length > 0) {
    const co = gitSafe(`checkout "${branchName}"`, cwd);
    return co.ok
      ? { branch: branchName, created: false, base: resolvedBase }
      : { branch: branchName, created: false, base: resolvedBase, error: co.err };
  }
  const co = gitSafe(`checkout -b "${branchName}" "${resolvedBase}"`, cwd);
  return co.ok
    ? { branch: branchName, created: true, base: resolvedBase }
    : { branch: branchName, created: false, base: resolvedBase, error: co.err };
}

/**
 * Reject file paths that could stage files outside the intended scope.
 * Returns null if safe, or an error message string if unsafe.
 */
function validateStagingPath(p) {
  if (typeof p !== 'string' || p.length === 0)     return 'empty path';
  if (path.isAbsolute(p))                          return `absolute path not allowed: ${p}`;
  if (p.includes('..'))                            return `path traversal not allowed: ${p}`;
  if (/[*?[\]{}]/.test(p))                         return `glob patterns not allowed: ${p}`;
  if (p.startsWith('.git/') || p === '.git')       return `.git directory not allowed: ${p}`;
  return null;
}

/**
 * Stage the listed paths and create a local commit. Returns { sha, error? }.
 * Never pushes. If nothing to commit, returns { sha: null, empty: true }.
 * Every path is validated against `validateStagingPath` — unsafe paths abort
 * the whole story (no partial staging).
 */
function commitSourceChanges(repoRoot, filePaths, commitMessage) {
  const cwd = { cwd: repoRoot };
  if (filePaths.length === 0) return { sha: null, empty: true };

  // Validate every path up-front so we don't stage some and reject others.
  for (const p of filePaths) {
    const err = validateStagingPath(p);
    if (err) return { sha: null, error: `Rejected unsafe file path: ${err}` };
  }

  for (const p of filePaths) {
    if (fs.existsSync(path.join(repoRoot, p))) {
      const r = gitSafe(`add -- "${p}"`, cwd);
      if (!r.ok) return { sha: null, error: `Staging ${p}: ${r.err}` };
    } else {
      // File doesn't exist in working tree — was likely deleted. Stage the deletion.
      const r = gitSafe(`add -A -- "${p}"`, cwd);
      if (!r.ok) return { sha: null, error: `Staging deleted ${p}: ${r.err}` };
    }
  }

  const staged = gitSafe(`diff --cached --name-only`, cwd);
  if (staged.ok && staged.out.trim() === '') {
    return { sha: null, empty: true };
  }

  const msgFile = path.join(repoRoot, `.git`, `EVYADELIVER_COMMITMSG_${process.pid}`);
  fs.writeFileSync(msgFile, commitMessage, 'utf8');
  try {
    const commit = gitSafe(`commit -F "${msgFile}"`, cwd);
    if (!commit.ok) return { sha: null, error: commit.err };
    const sha = gitSafe(`rev-parse --short HEAD`, cwd);
    return { sha: sha.ok ? sha.out : null };
  } finally {
    try { fs.unlinkSync(msgFile); } catch {}
  }
}

// ── Artefact writer ─────────────────────────────────────────────────────────────

/**
 * Write each artefact file into the story folder. Returns the list of written paths.
 * If the story folder doesn't exist yet (unlikely — CreateStory usually did it),
 * we create it.
 */
function writeArtefacts(repoRoot, storyId, artefacts) {
  const storyDir = adoMap.lookupDir(repoRoot, storyId)
                || path.join(repoRoot, '.evyasys', 'board', 'standalone', storyId);
  fs.mkdirSync(storyDir, { recursive: true });

  const written = [];
  const skipped = [];
  for (const [name, body] of Object.entries(artefacts || {})) {
    // Guard against traversal or path-separator smuggling in artefact names.
    if (name.includes('..') || name.includes('/') || name.includes('\\') || path.isAbsolute(name)) {
      skipped.push({ name, reason: 'unsafe path' });
      continue;
    }
    if (typeof body !== 'string' || body.trim().length === 0) {
      skipped.push({ name, reason: 'empty body' });
      continue;
    }
    const filename = name.startsWith(storyId + '_') ? name : `${storyId}_${name}`;
    const filePath = path.join(storyDir, filename);
    fs.writeFileSync(filePath, body + '\n', 'utf8');
    written.push(filePath);
  }
  return { storyDir, written, skipped };
}

// ── Main hook ───────────────────────────────────────────────────────────────────

module.exports = async function (ctx) {
  const cfg    = await loadConfig({ ctx });
  const output = ctx.agentResult || '';

  const pmLabel     = pm.toolLabel(cfg);
  const notifyLabel = notify.toolLabel(cfg);
  const hasNotify   = cfg.notificationTool !== 'none';

  // ── Parse ───────────────────────────────────────────────────────────────────
  const { stories, warnings } = parseArtefactBlocks(output);
  const manifest              = parseBatchManifest(output);

  if (warnings.length > 0) {
    ctx.send(`⚠️  Parsing warnings:\n${warnings.map(w => '  · ' + w).join('\n')}`);
  }

  if (stories.length === 0) {
    ctx.send(
      'No EVYADELIVER story blocks found in the agent output. ' +
      'Deliver expects one `<!-- EVYADELIVER: EVYA-XXXX { ... } -->` block per story.'
    );
    return;
  }

  const parseFailures = stories.filter(s => s._parseError);
  if (parseFailures.length > 0) {
    ctx.send(
      `⚠️  Skipping ${parseFailures.length} story block(s) that could not be parsed:\n` +
      parseFailures.map(f => `  · ${f.storyId} — ${f._parseError}`).join('\n')
    );
  }

  const deliverable = stories.filter(s => !s._parseError && s.verdict !== 'BLOCKED');
  const blocked     = stories.filter(s => s.verdict === 'BLOCKED');

  if (deliverable.length === 0) {
    ctx.send(`No stories to deliver — ${blocked.length} BLOCKED, ${parseFailures.length} unparseable.`);
    return;
  }

  // ── Batched confirmation gate — show real numbers ──────────────────────────
  let totalFiles = 0, totalArtefacts = 0, totalDocs = 0;
  const summary = deliverable.map(s => {
    const filesN = (s.filesChanged || []).length;
    const artN   = Object.keys(s.artefacts || {}).length;
    const docsN  = (s.docsToUpdate || []).length;
    const impN   = s.importantFindings || 0;
    const critN  = s.criticalFindings  || 0;
    totalFiles     += filesN;
    totalArtefacts += artN;
    totalDocs      += docsN;
    const gateStr = s.qualityGates
      ? Object.entries(s.qualityGates).map(([k, v]) => `${k}:${v[0]}`).join(' ')
      : '';
    const findStr = critN > 0 ? ` ⚠️ ${critN} Critical`
                  : impN > 0  ? ` (${impN} Important)`
                  : '';
    return `  ${s.storyId} — ${s.title || '(no title)'}\n` +
           `      ${filesN} src files · ${artN} artefacts · ${docsN} doc(s) to flag · ${s.verdict}${findStr}` +
           (gateStr ? `\n      gates: ${gateStr}` : '');
  }).join('\n');

  const commitEnabled = !!(manifest && manifest.commitEnabled);
  const gitStep = commitEnabled
    ? `  · Ensure feature branch exists and create a local commit of the working-tree changes (never pushed)\n`
    : '';

  const prompt = `Ready to finalise ${deliverable.length} stor${deliverable.length !== 1 ? 'ies' : 'y'}?\n\n${summary}\n\n` +
                 `Batch totals: ${totalFiles} src files touched · ${totalArtefacts} artefacts · ${totalDocs} doc(s) to flag for retrain\n` +
                 `Git behaviour: ${commitEnabled ? '🔧 --commit enabled (branch + local commit will be created)' : '📝 default (no git operations — you commit manually)'}\n\n` +
                 `For each story I will:\n` +
                 `  · Write 4 artefacts to .evyasys/board/**/{storyId}/ (TechBrainstorm, DevSummary, CodeReview, TestPlan)\n` +
                 gitStep +
                 `  · Set state to Ready for QA in ${pmLabel}\n` +
                 (hasNotify ? `  · Send one dev-finished notification to ${notifyLabel} (per-${manifest?.inputMode === 'epic' ? 'epic' : 'story'})\n` : '') +
                 `  · Update traceability + refresh .evyasys/CONTEXT.md\n`;

  if (!(await ctx.confirm(prompt))) {
    ctx.send('Delivery cancelled — nothing was written or notified. Working-tree changes are intact.');
    return;
  }

  // ── Per-story pipeline ─────────────────────────────────────────────────────
  // Each phase records its own error under `result.errors.<phase>` so the
  // status report can attribute failures precisely instead of a generic error.
  const results    = [];
  const map        = adoMap.snapshot(cfg.repoRoot);
  const epicGroups = manifest?.epicGroups || [];
  const inputMode  = manifest?.inputMode || 'story';

  for (const s of deliverable) {
    const result = {
      storyId:  s.storyId,
      epicId:   s.epicId,
      title:    s.title,
      verdict:  s.verdict,
      errors:   {},
    };

    // Phase A — Write artefacts to the story folder
    try {
      const w = writeArtefacts(cfg.repoRoot, s.storyId, s.artefacts);
      result.artefacts = w.written;
      result.storyDir  = w.storyDir;
      if (w.skipped.length > 0) result.artefactsSkipped = w.skipped;
    } catch (err) {
      result.errors.artefacts = err.message;
    }

    // Phase B — Feature branch + local commit (ONLY when --commit was passed)
    if (commitEnabled && s.featureBranch && Array.isArray(s.filesChanged) && s.filesChanged.length > 0) {
      try {
        const br = ensureFeatureBranch(cfg.repoRoot, s.featureBranch);
        result.featureBranch = br.branch;
        result.branchCreated = !!br.created;
        result.baseBranch    = br.base;
        if (br.error) {
          result.errors.branch = br.error;
        } else {
          const paths  = s.filesChanged.map(f => f && f.path).filter(Boolean);
          const commit = commitSourceChanges(
            cfg.repoRoot,
            paths,
            s.commitMessage || `feat(${s.storyId}): ${s.title || 'delivery'}`
          );
          if (commit.sha)   result.commitSha  = commit.sha;
          if (commit.empty) result.commitNote = 'Nothing to commit (no source-file changes in the working tree)';
          if (commit.error) result.errors.commit = commit.error;
        }
      } catch (err) {
        result.errors.commit = err.message;
      }
    } else if (!commitEnabled) {
      // Explicitly record the file count so the traceability entry still has it,
      // but flag the state as "in working tree, uncommitted" for the status report.
      result.workingTreeOnly = true;
      result.filesInWorkingTree = (s.filesChanged || []).length;
    }

    // Phase C — PM state → Ready for QA
    try {
      const pmStoryId = map.lookup(s.storyId);
      const idForPm   = pmStoryId || s.storyId;
      const setRes    = await runIntegration({
        name: `${cfg.pmTool}:set-state(Ready for QA) [#${idForPm}]`, cfg,
        args: { storyId: idForPm, state: 'Ready for QA' },
        live: () => pm.setState(cfg, { storyId: idForPm, state: 'Ready for QA' }),
      });
      result.pmUpdated = !!setRes || cfg.pmTool === 'local';
      result.pmId      = pmStoryId;
    } catch (err) {
      result.errors.pm = err.message;
    }

    // Phase D — Notification (per-story mode only; epic mode fires at the end)
    if (hasNotify && inputMode === 'story') {
      try {
        await runIntegration({
          name: `notify:dev-finished [${s.storyId}]`, cfg,
          args: { event: 'dev-finished', storyId: s.storyId },
          live: () => notify.send(cfg, { event: 'dev-finished', storyId: s.storyId }),
        });
        result.notified = true;
      } catch (err) {
        result.errors.notify = err.message;
      }
    }

    // Phase E — Traceability (best-effort — never blocks delivery on I/O error)
    try {
      traceability.record(cfg.repoRoot, s.storyId, {
        verdict:           s.verdict,
        commitSha:         result.commitSha || null,
        branch:            result.featureBranch || null,
        epicId:            s.epicId || null,
        filesTouched:      (s.filesChanged || []).map(f => f && f.path).filter(Boolean),
        docsFlagged:       s.docsToUpdate || [],
        criticalFindings:  s.criticalFindings  || 0,
        importantFindings: s.importantFindings || 0,
      });
      result.tracked = true;
    } catch (err) {
      result.errors.traceability = err.message;
    }

    results.push(result);
  }

  // Regenerate CONTEXT.md once after the batch — the always-loaded summary
  // for every future command's Phase 0. Best-effort: failure logs a warning
  // but never blocks the batch report.
  const ctxRes = contextDoc.regenerate(cfg.repoRoot);
  if (ctxRes.ok) {
    ctx.send(`📝 Refreshed \`.evyasys/CONTEXT.md\` (${ctxRes.bytes} bytes) — always-loaded summary now current.`);
  } else if (ctxRes.error) {
    ctx.send(`⚠️  Could not refresh CONTEXT.md: ${ctxRes.error}`);
  }

  // Epic-mode batched notifications (one per epic group). `count` is passed
  // in extras; downstream integrations may render it if their handler accepts it.
  if (hasNotify && inputMode === 'epic' && epicGroups.length > 0) {
    for (const grp of epicGroups) {
      const included = results.filter(r => r.epicId === grp.epicId);
      if (included.length === 0) continue;
      try {
        await runIntegration({
          name: `notify:epic-delivered [${grp.epicId}]`, cfg,
          args: { event: 'dev-finished', storyId: grp.epicId, count: included.length },
          live: () => notify.send(cfg, {
            event:   'dev-finished',
            storyId: grp.epicId,
            count:   included.length,
          }),
        });
      } catch (err) {
        // Attribute the failure to every included story so the report shows it.
        for (const r of included) r.errors.notify = `epic notify failed: ${err.message}`;
      }
    }
  }

  // ── Status report ──────────────────────────────────────────────────────────
  const isClean   = (r) => Object.keys(r.errors).length === 0;
  const succeeded = results.filter(isClean);
  const partial   = results.filter(r => !isClean(r));

  for (const r of results) {
    const parts = [];
    if ((r.artefacts || []).length > 0) parts.push(`${r.artefacts.length} artefact(s) written`);
    if (r.workingTreeOnly && r.filesInWorkingTree > 0) {
      parts.push(`${r.filesInWorkingTree} file(s) in working tree (uncommitted)`);
    }
    if (r.featureBranch)  parts.push(`branch \`${r.featureBranch}\`${r.branchCreated ? ' (created)' : ''}${r.baseBranch ? ` from ${r.baseBranch}` : ''}`);
    if (r.commitSha)      parts.push(`commit \`${r.commitSha}\` (local — not pushed)`);
    if (r.commitNote)     parts.push(r.commitNote);
    if (r.pmUpdated)      parts.push(`PM → Ready for QA${r.pmId ? ` (#${r.pmId})` : ''}`);
    if (r.notified)       parts.push(`notified ${notifyLabel}`);

    const errParts = [];
    if (r.errors.artefacts) errParts.push(`artefacts: ${r.errors.artefacts.slice(0, 80)}`);
    if (r.errors.branch)    errParts.push(`branch: ${r.errors.branch.slice(0, 80)}`);
    if (r.errors.commit)    errParts.push(`commit: ${r.errors.commit.slice(0, 80)}`);
    if (r.errors.pm)        errParts.push(`PM: ${r.errors.pm.slice(0, 80)}`);
    if (r.errors.notify)    errParts.push(`notify: ${r.errors.notify.slice(0, 80)}`);

    const status = isClean(r) ? '✅' : '⚠️';
    const body   = [
      `${status} ${r.storyId} — ${r.title || ''}`,
      parts.length   > 0 ? `   ${parts.join(' · ')}` : '',
      errParts.length > 0 ? `   ⚠️  errors: ${errParts.join(' · ')}` : '',
    ].filter(Boolean).join('\n');
    ctx.send(body);
  }

  const nextStepsCommit = commitEnabled
    ? `Next: review the commit with \`git show HEAD\`, push when ready (\`git push -u origin <feature-branch>\`), then \`/evyasys:StartQa <StoryID>\` to begin QA.`
    : `Next: review the changes in your working tree with \`git status\` / \`git diff\`, commit + push when ready, then \`/evyasys:StartQa <StoryID>\` to begin QA.`;

  ctx.send(
    `\n📊 Delivery batch complete — ` +
    `${succeeded.length} succeeded, ${partial.length} with warnings, ${blocked.length} blocked.\n` +
    (succeeded.length > 0 ? nextStepsCommit : '')
  );
};

/**
 * Post-agent hook for evyasys-deliver.
 *
 * End-to-end delivery: parses the agent's per-story artefact blocks and does
 * the mechanical work — writes artefact files, creates the feature branch,
 * commits the source-file changes locally, transitions PM state to Ready for QA,
 * fires one notification per story (or per epic in epic mode).
 *
 * The agent DOES the code work (writes source files during Phase 3).
 * The hook DOES the mechanical dispatch (git commit, PM update, notification).
 *
 * Nothing is pushed to the remote — user pushes manually when ready.
 */
const path            = require('path');
const fs              = require('fs');
const { execSync }    = require('child_process');
const { runIntegration } = require('../../scripts/lib/dryrun');
const { loadConfig }     = require('../../scripts/lib/config');
const adoMap             = require('../../scripts/lib/ado-map');
const pm                 = require('../../scripts/lib/pm-adapter');
const notify             = require('../../scripts/lib/notify-adapter');

// ── Parsing helpers ─────────────────────────────────────────────────────────────

/**
 * Parse `<!-- EVYADELIVER: STORYID { json } -->` blocks. Returns an array of
 * per-story artefact objects, in emission order.
 */
function parseArtefactBlocks(text) {
  const out    = [];
  const regex  = /<!--\s*EVYADELIVER:\s*([\w-]+)\s*([\s\S]*?)-->/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(m[2].trim());
      out.push(parsed);
    } catch (err) {
      // Skip malformed blocks — the agent will be told at the end.
      out.push({ storyId: m[1], _parseError: err.message });
    }
  }
  return out;
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
 * Ensure the target feature branch exists locally; create from base if not.
 * Returns { branch, created, error? }.
 */
function ensureFeatureBranch(repoRoot, branchName, base = 'main') {
  const cwd = { cwd: repoRoot };
  const list = gitSafe(`branch --list "${branchName}"`, cwd);
  if (list.ok && list.out.trim().length > 0) {
    // Branch exists — checkout to it
    const co = gitSafe(`checkout "${branchName}"`, cwd);
    return co.ok ? { branch: branchName, created: false } : { branch: branchName, created: false, error: co.err };
  }
  // Create from base
  const co = gitSafe(`checkout -b "${branchName}" "${base}"`, cwd);
  return co.ok ? { branch: branchName, created: true } : { branch: branchName, created: false, error: co.err };
}

/**
 * Stage the listed paths and create a local commit. Returns { sha, error? }.
 * Never pushes. If nothing to commit, returns { sha: null, empty: true }.
 */
function commitSourceChanges(repoRoot, filePaths, commitMessage) {
  const cwd = { cwd: repoRoot };
  if (filePaths.length === 0) return { sha: null, empty: true };

  // Stage only the listed files — safer than `git add -A`.
  for (const p of filePaths) {
    // Skip files that don't exist (e.g. a "deleted" entry — git handles those via -A on that path).
    if (fs.existsSync(path.join(repoRoot, p))) {
      const r = gitSafe(`add -- "${p}"`, cwd);
      if (!r.ok) return { sha: null, error: `Staging ${p}: ${r.err}` };
    } else {
      const r = gitSafe(`add -A -- "${p}"`, cwd); // handles deleted files
      if (!r.ok) return { sha: null, error: `Staging ${p}: ${r.err}` };
    }
  }

  // Check if there's anything staged
  const staged = gitSafe(`diff --cached --name-only`, cwd);
  if (staged.ok && staged.out.trim() === '') {
    return { sha: null, empty: true };
  }

  // Commit. Write message to a temp file to avoid escaping headaches.
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
  for (const [name, body] of Object.entries(artefacts || {})) {
    // Expected artefact names: TechBrainstorm.md, DevSummary.md, CodeReview.md, TestPlan.md, ReleaseNotes.md
    const cleanName = name.replace(/^\/+/, '').replace(/\.\.+/g, '');
    const filename  = cleanName.startsWith(storyId + '_') ? cleanName : `${storyId}_${cleanName}`;
    const filePath  = path.join(storyDir, filename);
    fs.writeFileSync(filePath, body + '\n', 'utf8');
    written.push(filePath);
  }
  return { storyDir, written };
}

// ── Main hook ───────────────────────────────────────────────────────────────────

module.exports = async function (ctx) {
  const cfg    = await loadConfig({ ctx });
  const output = ctx.agentResult || '';

  const pmLabel     = pm.toolLabel(cfg);
  const notifyLabel = notify.toolLabel(cfg);
  const hasNotify   = cfg.notificationTool !== 'none';

  // ── Parse ───────────────────────────────────────────────────────────────────
  const stories  = parseArtefactBlocks(output);
  const manifest = parseBatchManifest(output);

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
      `⚠️  Skipping ${parseFailures.length} story block(s) that could not be parsed: ` +
      parseFailures.map(f => `${f.storyId} (${f._parseError})`).join('; ')
    );
  }

  const deliverable = stories.filter(s => !s._parseError && s.verdict !== 'BLOCKED');
  const blocked     = stories.filter(s => s.verdict === 'BLOCKED');

  if (deliverable.length === 0) {
    ctx.send(`No stories to deliver — ${blocked.length} BLOCKED, ${parseFailures.length} unparseable.`);
    return;
  }

  // ── Batched confirmation gate ───────────────────────────────────────────────
  const notifyPart = hasNotify ? ` and notify ${notifyLabel}` : '';
  const summary    = deliverable.map(s => {
    const filesN = (s.filesChanged || []).length;
    const artN   = Object.keys(s.artefacts || {}).length;
    return `  ${s.storyId} — ${s.title || '(no title)'} — ${filesN} src files · ${artN} artefacts · ${s.verdict}`;
  }).join('\n');

  const prompt = `Ready to deliver ${deliverable.length} stor${deliverable.length !== 1 ? 'ies' : 'y'}?\n${summary}\n\n` +
                 `For each story I will:\n` +
                 `  1. Write artefacts to .evyasys/board/**/${'{storyId}'}/\n` +
                 `  2. Create/checkout the feature branch and commit source changes locally (not pushed)\n` +
                 `  3. Set state to Ready for QA in ${pmLabel}\n` +
                 (hasNotify ? `  4. Send one dev-finished notification to ${notifyLabel} per ${manifest?.inputMode === 'epic' ? 'epic' : 'story'}\n` : '');

  if (!(await ctx.confirm(prompt))) {
    ctx.send('Delivery cancelled — nothing was written, committed, or notified.');
    return;
  }

  // ── Per-story pipeline ─────────────────────────────────────────────────────
  const results   = [];
  const map       = adoMap.snapshot(cfg.repoRoot);
  const epicGroups = manifest?.epicGroups || [];
  const inputMode  = manifest?.inputMode || 'story';

  for (const s of deliverable) {
    const result = { storyId: s.storyId, epicId: s.epicId, title: s.title, verdict: s.verdict };
    try {
      // 1. Write artefacts
      const w = writeArtefacts(cfg.repoRoot, s.storyId, s.artefacts);
      result.artefacts = w.written;
      result.storyDir  = w.storyDir;

      // 2. Feature branch + commit
      if (s.featureBranch && Array.isArray(s.filesChanged) && s.filesChanged.length > 0) {
        const br = ensureFeatureBranch(cfg.repoRoot, s.featureBranch);
        result.featureBranch = br.branch;
        result.branchCreated = !!br.created;
        if (br.error) {
          result.branchError = br.error;
        } else {
          const paths  = s.filesChanged.map(f => f.path).filter(Boolean);
          const commit = commitSourceChanges(cfg.repoRoot, paths, s.commitMessage || `feat(${s.storyId}): ${s.title || 'delivery'}`);
          if (commit.sha)   result.commitSha  = commit.sha;
          if (commit.empty) result.commitNote = 'Nothing to commit (no source-file changes detected in working tree)';
          if (commit.error) result.commitError = commit.error;
        }
      }

      // 3. PM state → Ready for QA
      const pmStoryId = map.lookup(s.storyId);
      const idForPm   = pmStoryId || s.storyId;
      const setRes    = await runIntegration({
        name: `${cfg.pmTool}:set-state(Ready for QA) [#${idForPm}]`, cfg,
        args: { storyId: idForPm, state: 'Ready for QA' },
        live: () => pm.setState(cfg, { storyId: idForPm, state: 'Ready for QA' }),
      });
      result.pmUpdated = !!setRes;
      result.pmId      = pmStoryId;

      // 4. Notification — deferred to end for epic mode
      if (hasNotify && inputMode === 'story') {
        await runIntegration({
          name: `notify:dev-finished [${s.storyId}]`, cfg,
          args: { event: 'dev-finished', storyId: s.storyId },
          live: () => notify.send(cfg, { event: 'dev-finished', storyId: s.storyId }),
        });
        result.notified = true;
      }
    } catch (err) {
      result.error = err.message;
    }

    results.push(result);
  }

  // Epic-mode batched notifications (one per epic group)
  if (hasNotify && inputMode === 'epic' && epicGroups.length > 0) {
    for (const grp of epicGroups) {
      const included = results.filter(r => r.epicId === grp.epicId);
      if (included.length === 0) continue;
      await runIntegration({
        name: `notify:epic-delivered [${grp.epicId}]`, cfg,
        args: { event: 'dev-finished', storyId: grp.epicId, count: included.length },
        live: () => notify.send(cfg, { event: 'dev-finished', storyId: grp.epicId, count: included.length }),
      });
    }
  }

  // ── Status report ──────────────────────────────────────────────────────────
  const succeeded = results.filter(r => !r.error && !r.commitError && !r.branchError);
  const partial   = results.filter(r => r.error || r.commitError || r.branchError);

  for (const r of results) {
    const parts = [];
    if (r.commitSha)      parts.push(`commit ${r.commitSha}`);
    if (r.commitNote)     parts.push(r.commitNote);
    if (r.featureBranch)  parts.push(`branch ${r.featureBranch}${r.branchCreated ? ' (created)' : ''}`);
    if (r.pmUpdated)      parts.push(`PM → Ready for QA${r.pmId ? ` (#${r.pmId})` : ''}`);
    if (r.notified)       parts.push(`notified ${notifyLabel}`);
    if (r.branchError)    parts.push(`⚠️  branch error: ${r.branchError.slice(0, 80)}`);
    if (r.commitError)    parts.push(`⚠️  commit error: ${r.commitError.slice(0, 80)}`);
    if (r.error)          parts.push(`❌ ${r.error.slice(0, 80)}`);
    ctx.send(`✅ ${r.storyId} — ${r.title || ''}\n   ${parts.join(' · ')}`);
  }

  ctx.send(
    `\n📊 Delivery batch complete — ` +
    `${succeeded.length} succeeded, ${partial.length} with warnings, ${blocked.length} blocked.\n` +
    (succeeded.length > 0
      ? `Next: review the diffs with \`git diff main...HEAD\`, push when ready, then run \`/evyasys:StartQa <StoryID>\` to begin QA.`
      : '')
  );
};

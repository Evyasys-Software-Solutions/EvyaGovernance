/**
 * `.evyasys/CONTEXT.md` generator.
 *
 * A small, always-loaded summary that every command reads at Phase 0 instead of
 * re-scanning the entire codebase and docs directory. It's the RAG summary of
 * the project's own state, regenerated on every TrainDocs / Deliver / CreateFunctionalDocs
 * run so it stays fresh.
 *
 * Purpose:
 *   - Speed:            one small file replaces 20+ heavier doc reads at Phase 0
 *   - Anti-hallucination: LLM always starts from an accurate ground-truth summary
 *   - Architecture management: highlights the current state so drift is visible
 *   - Onboarding:       new team members read CONTEXT.md and understand the project
 *
 * Contents (auto-generated — never hand-edited):
 *   - Tech stack (from STACK.md heading)
 *   - Architecture layers (from ARCHITECTURE.md)
 *   - Approved patterns (from PATTERNS.md)
 *   - Permission model (from RBAC.md)
 *   - Recent delivered stories (from traceability.json)
 *   - Active board stories (from .evyasys/board/)
 *   - Health signals (docs age, file counts)
 */
const fs   = require('fs');
const path = require('path');
const traceability = require('./traceability');

const CONTEXT_FILE = 'CONTEXT.md';
const MAX_RECENT_STORIES = 5;
const MAX_ACTIVE_STORIES = 8;

/**
 * Extract the first section of a markdown doc (heading through the next `## `).
 * Trims to ~N lines. Used to lift the "at a glance" content from each source doc.
 */
function extractFirstSection(docPath, maxLines = 10) {
  if (!fs.existsSync(docPath)) return null;
  const raw = fs.readFileSync(docPath, 'utf8').split('\n');
  const lines = [];
  let inFirst = false;
  for (const line of raw) {
    if (line.match(/^#\s+/)) { inFirst = true; continue; }
    if (inFirst && line.match(/^##\s+/)) break;
    if (inFirst) lines.push(line);
    if (lines.length >= maxLines * 2) break;
  }
  const body = lines.join('\n').trim().split('\n').slice(0, maxLines).join('\n');
  return body || null;
}

/**
 * Scan `.evyasys/board/` for active story folders. Returns lightweight summaries
 * (id + title from the story's H1) sorted by folder mtime desc, capped at N.
 */
function scanActiveStories(repoRoot, cap = MAX_ACTIVE_STORIES) {
  const boardDir = path.join(repoRoot, '.evyasys', 'board');
  if (!fs.existsSync(boardDir)) return [];

  const found = [];
  const stack = [boardDir];
  const STORY_ID_RE = /^(EVYA|EP)-\d+$/;

  while (stack.length > 0) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const p = path.join(dir, ent.name);
      if (STORY_ID_RE.test(ent.name)) {
        const storyId = ent.name;
        const userStory = path.join(p, `${storyId}_UserStory.md`);
        if (fs.existsSync(userStory)) {
          try {
            const first = fs.readFileSync(userStory, 'utf8').split('\n').find(l => l.startsWith('# '));
            const title = first ? first.replace(/^#\s+/, '').trim() : '';
            const mtime = fs.statSync(p).mtimeMs;
            const hasDevSummary = fs.existsSync(path.join(p, `${storyId}_DevSummary.md`));
            const hasTestPlan   = fs.existsSync(path.join(p, `${storyId}_TestPlan.md`));
            const hasRelease    = fs.existsSync(path.join(p, `${storyId}_ReleaseNotes.md`));
            let stage = 'Draft';
            if (hasRelease)         stage = 'Done';
            else if (hasTestPlan)   stage = 'In QA';
            else if (hasDevSummary) stage = 'Ready for QA';
            found.push({ storyId, title, stage, mtime });
          } catch { /* skip */ }
        }
      } else {
        stack.push(p);
      }
    }
  }

  return found.sort((a, b) => b.mtime - a.mtime).slice(0, cap);
}

/**
 * Sample a subset of standards docs and pull their "at a glance" first section.
 */
function loadDocsSummary(docsDir) {
  return {
    stack:        extractFirstSection(path.join(docsDir, 'STACK.md'),        6),
    architecture: extractFirstSection(path.join(docsDir, 'ARCHITECTURE.md'), 8),
    patterns:     extractFirstSection(path.join(docsDir, 'PATTERNS.md'),     6),
    rbac:         extractFirstSection(path.join(docsDir, 'RBAC.md'),         6),
    standards:    extractFirstSection(path.join(docsDir, 'STANDARDS.md'),    6),
  };
}

/**
 * Count generated docs and get their most-recent mtime — used as the docs-freshness signal.
 */
function docsHealth(docsDir) {
  if (!fs.existsSync(docsDir)) return { count: 0, latestMtime: null, functionalCount: 0 };
  const entries = fs.readdirSync(docsDir, { withFileTypes: true });
  let count = 0, latest = 0;
  for (const ent of entries) {
    if (ent.isFile() && ent.name.endsWith('.md')) {
      count++;
      const m = fs.statSync(path.join(docsDir, ent.name)).mtimeMs;
      if (m > latest) latest = m;
    }
  }
  const functionalDir = path.join(docsDir, 'functional');
  const functionalCount = fs.existsSync(functionalDir)
    ? fs.readdirSync(functionalDir).filter(f => f.endsWith('.md') && f !== 'INDEX.md').length
    : 0;
  return {
    count,
    latestMtime: latest ? new Date(latest).toISOString().slice(0, 10) : null,
    functionalCount,
  };
}

/**
 * Build the full CONTEXT.md body from the current state.
 */
function build(repoRoot) {
  const docsDir  = path.join(repoRoot, '.evyasys', 'docs');
  const summary  = loadDocsSummary(docsDir);
  const health   = docsHealth(docsDir);
  const recent   = traceability.recent(repoRoot, MAX_RECENT_STORIES);
  const active   = scanActiveStories(repoRoot);
  const today    = new Date().toISOString().slice(0, 10);

  const section = (title, body) =>
    body ? `\n## ${title}\n\n${body}\n` : '';

  const recentBlock = recent.length > 0
    ? recent.map(r => `- **${r.storyId}** (${r.deliveredAt ? r.deliveredAt.slice(0, 10) : '?'}) · commit \`${r.commitSha || '—'}\` · verdict ${r.verdict || '?'} · files touched: ${(r.filesTouched || []).length}`).join('\n')
    : '_No delivered stories recorded yet. `/evyasys:Deliver` populates this section on each successful delivery._';

  const activeBlock = active.length > 0
    ? active.map(a => `- **${a.storyId}** [${a.stage}] — ${a.title || '(no title)'}`).join('\n')
    : '_No active stories in `.evyasys/board/`. `/evyasys:CreateStory` starts one._';

  const healthBlock = `- Quality-gate docs generated: **${health.count}**${health.latestMtime ? ` · latest update **${health.latestMtime}**` : ''}\n` +
                      `- Functional docs (RAG-ready modules): **${health.functionalCount}**\n` +
                      `- Recent deliveries tracked: **${recent.length}**\n` +
                      `- Active board stories: **${active.length}**`;

  return [
    `# Project Context — auto-generated`,
    ``,
    `> Regenerated on **${today}** by /evyasys:TrainDocs · /evyasys:CreateFunctionalDocs · /evyasys:Deliver`,
    `> **Do not edit by hand.** Every command reads this file at Phase 0 as the ground-truth summary.`,
    section('Tech stack (from STACK.md)',           summary.stack),
    section('Architecture (from ARCHITECTURE.md)',  summary.architecture),
    section('Approved patterns (from PATTERNS.md)', summary.patterns),
    section('Coding standards (from STANDARDS.md)', summary.standards),
    section('Permission model (from RBAC.md)',      summary.rbac),
    section('Recent deliveries',                    recentBlock),
    section('Active stories on the board',          activeBlock),
    section('Health signals',                       healthBlock),
    ``,
    `---`,
    ``,
    `_Auto-generated by \`scripts/lib/context-doc.js\`. Regenerated whenever docs, board, or delivery state changes._`,
    ``,
  ].join('\n');
}

/**
 * Regenerate `.evyasys/CONTEXT.md`. Best-effort — swallows and returns errors
 * rather than throwing, so callers (hooks) never fail because of context-doc issues.
 */
function regenerate(repoRoot) {
  try {
    const evyaDir = path.join(repoRoot, '.evyasys');
    if (!fs.existsSync(evyaDir)) return { ok: false, reason: 'no .evyasys dir' };
    const body = build(repoRoot);
    const out  = path.join(evyaDir, CONTEXT_FILE);
    fs.writeFileSync(out, body, 'utf8');
    return { ok: true, path: out, bytes: body.length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { regenerate, build };

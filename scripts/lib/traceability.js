/**
 * Traceability layer — `.evyasys/traceability.json`.
 *
 * Records what each Deliver run touched: files, docs flagged, commit SHA, branch.
 * Enables downstream queries: "which stories touched this file?", "which docs need
 * a retrain?", "when was this feature last delivered?".
 *
 * Schema:
 *   {
 *     "version": "1.0",
 *     "stories": {
 *       "EVYA-1042": {
 *         "deliveredAt": "2026-08-12T10:30:00.000Z",
 *         "verdict": "SUCCESS" | "PARTIAL",
 *         "commitSha": "abc1234",
 *         "branch": "feature/EVYA-1042-title",
 *         "epicId": "EP-001" | null,
 *         "filesTouched": ["src/foo.js", "src/bar.js"],
 *         "docsFlagged": ["PATTERNS.md"],
 *         "criticalFindings":  0,
 *         "importantFindings": 2
 *       }
 *     }
 *   }
 *
 * All reads/writes use atomic tmp+rename via ado-map style so concurrent
 * Deliver runs (rare, but possible) never corrupt the file.
 */
const fs   = require('fs');
const path = require('path');

const SCHEMA_VERSION = '1.0';

function tracePath(repoRoot) {
  return path.join(repoRoot, '.evyasys', 'traceability.json');
}

/**
 * One-shot read. Returns { version, stories: {} } on missing or corrupt file.
 * @param {string} repoRoot
 */
function read(repoRoot) {
  const file = tracePath(repoRoot);
  if (!fs.existsSync(file)) return { version: SCHEMA_VERSION, stories: {} };
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!parsed.stories) parsed.stories = {};
    if (!parsed.version) parsed.version = SCHEMA_VERSION;
    return parsed;
  } catch {
    return { version: SCHEMA_VERSION, stories: {} };
  }
}

/**
 * Merge one story's traceability entry. Atomic write via tmp+rename.
 * @param {string} repoRoot
 * @param {string} storyId
 * @param {object} entry — partial merge on top of existing entry for this story
 */
function record(repoRoot, storyId, entry) {
  const file = tracePath(repoRoot);
  fs.mkdirSync(path.dirname(file), { recursive: true });

  // Re-read on disk to capture any concurrent update from another hook run.
  const current = read(repoRoot);
  const existing = current.stories[storyId] || {};
  current.stories[storyId] = {
    ...existing,
    ...entry,
    // Merge arrays instead of overwriting (dedup)
    filesTouched: dedup([...(existing.filesTouched || []), ...(entry.filesTouched || [])]),
    docsFlagged:  dedup([...(existing.docsFlagged  || []), ...(entry.docsFlagged  || [])]),
    // Always update the timestamp on any record()
    deliveredAt:  entry.deliveredAt || new Date().toISOString(),
  };

  const tmp = file + '.tmp-' + process.pid + '-' + Date.now();
  fs.writeFileSync(tmp, JSON.stringify(current, null, 2) + '\n', 'utf8');
  try {
    fs.renameSync(tmp, file);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch {}
    throw err;
  }
}

function dedup(arr) { return [...new Set(arr.filter(Boolean))]; }

/**
 * Find stories that touched a given file. Returns { storyId, entry }[] sorted
 * most-recent first.
 */
function findByFile(repoRoot, filePath) {
  const data = read(repoRoot);
  return Object.entries(data.stories)
    .filter(([, entry]) => (entry.filesTouched || []).includes(filePath))
    .map(([storyId, entry]) => ({ storyId, entry }))
    .sort((a, b) => (b.entry.deliveredAt || '').localeCompare(a.entry.deliveredAt || ''));
}

/**
 * Find stories that flagged a doc for update. Useful to decide when to run
 * `/evyasys:TrainDocs --retrain`.
 */
function findByDoc(repoRoot, docName) {
  const data = read(repoRoot);
  return Object.entries(data.stories)
    .filter(([, entry]) => (entry.docsFlagged || []).includes(docName))
    .map(([storyId, entry]) => ({ storyId, entry }))
    .sort((a, b) => (b.entry.deliveredAt || '').localeCompare(a.entry.deliveredAt || ''));
}

/**
 * Return the N most recently delivered stories (for CONTEXT.md summary).
 */
function recent(repoRoot, n = 5) {
  const data = read(repoRoot);
  return Object.entries(data.stories)
    .map(([storyId, entry]) => ({ storyId, ...entry }))
    .sort((a, b) => (b.deliveredAt || '').localeCompare(a.deliveredAt || ''))
    .slice(0, n);
}

module.exports = { read, record, findByFile, findByDoc, recent, tracePath };

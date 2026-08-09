/**
 * Evyasys ID → PM (ADO/JIRA/GitHub) mapping.
 *
 * Stored at .evyasys/.ado-map.json in the project repo so every skill hook
 * can resolve an Evyasys-style ID (e.g. "EVYA-1042", "EP-001") to the numeric
 * PM work item ID needed for hierarchy linking, and to find the local directory
 * where all story artefacts are saved.
 *
 * Map value formats:
 *   number              → plain PM ID (Epics)
 *   { adoId, dir }      → PM ID + absolute path to the story folder (Stories)
 *
 * File is committed alongside story artefacts so the mapping survives across
 * sessions and is shared with teammates.
 *
 * API:
 *   read(repoRoot)                — one-shot read of the JSON file (uncached)
 *   snapshot(repoRoot)            — cached read; returns methods that share the cache
 *                                   (RECOMMENDED for batch hooks — one read for N lookups)
 *   save(repoRoot, entries)       — atomic merge-and-write (re-reads on disk to avoid
 *                                   clobbering concurrent updates from another hook)
 *   lookup(repoRoot, id)          — uncached; use snapshot() in batch loops
 *   lookupDir(repoRoot, id)       — uncached; use snapshot() in batch loops
 */
const fs   = require('fs');
const path = require('path');
const os   = require('os');

function mapPath(repoRoot) {
  return path.join(repoRoot, '.evyasys', '.ado-map.json');
}

/**
 * One-shot read from disk. Returns {} on missing file or parse failure.
 * @param {string} repoRoot
 * @returns {Record<string, number|{adoId:number, dir:string}>}
 */
function read(repoRoot) {
  const file = mapPath(repoRoot);
  if (!fs.existsSync(file)) return {};
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; }
}

function extractId(val)  { return val == null ? null : (typeof val === 'object' ? (val.adoId ?? null) : val); }
function extractDir(val) { return (val && typeof val === 'object') ? (val.dir ?? null) : null; }

/**
 * Cached snapshot. Reads the file once; subsequent lookups hit memory.
 * `save()` performs an atomic merge and updates the local cache.
 *
 * Use in batch hooks:
 *   const m = adoMap.snapshot(repoRoot);
 *   for (const s of stories) { const id = m.lookup(s.storyId); ... }
 *   m.save({ [newId]: value });   // atomic write, cache updated
 *
 * @param {string} repoRoot
 */
function snapshot(repoRoot) {
  let cache = read(repoRoot);
  return {
    lookup(id)    { return extractId(cache[id]); },
    lookupDir(id) { return extractDir(cache[id]); },
    has(id)       { return cache[id] != null; },
    raw()         { return { ...cache }; },
    save(entries) {
      atomicWrite(repoRoot, entries);
      // Re-sync cache from the freshly-merged file to include any concurrent changes.
      cache = read(repoRoot);
    },
  };
}

/**
 * Persist entries atomically:
 *   1. Re-read the current file (captures any concurrent updates from other hooks)
 *   2. Merge our new entries in
 *   3. Write to a sibling tmp file, then rename over the destination (atomic on POSIX,
 *      atomic-under-lock on Windows via MoveFileEx).
 *
 * This reduces the concurrent-write race window from "read...write" to just the
 * rename step, which the OS guarantees is atomic.
 *
 * @param {string} repoRoot
 * @param {Record<string, number|{adoId:number, dir:string}>} entries
 */
function atomicWrite(repoRoot, entries) {
  const file = mapPath(repoRoot);
  fs.mkdirSync(path.dirname(file), { recursive: true });

  // Re-read on disk immediately before merging so we don't clobber another hook's write.
  const current = read(repoRoot);
  const merged  = { ...current, ...entries };
  const tmp     = file + '.tmp-' + process.pid + '-' + Date.now();

  fs.writeFileSync(tmp, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  try {
    fs.renameSync(tmp, file);
  } catch (err) {
    // Best-effort cleanup of the tmp file if rename failed
    try { fs.unlinkSync(tmp); } catch {}
    throw err;
  }
}

function save(repoRoot, entries) {
  atomicWrite(repoRoot, entries);
}

function lookup(repoRoot, evyasysId) {
  return extractId(read(repoRoot)[evyasysId]);
}

function lookupDir(repoRoot, evyasysId) {
  return extractDir(read(repoRoot)[evyasysId]);
}

module.exports = { read, snapshot, save, lookup, lookupDir };

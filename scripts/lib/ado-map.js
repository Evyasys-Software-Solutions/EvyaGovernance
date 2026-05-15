/**
 * Evyasys ID → ADO numeric ID mapping.
 *
 * Stored at .evyasys/.ado-map.json in the project repo so every skill hook
 * can resolve an Evyasys-style ID (e.g. "EVYA-1042", "EP-001") to the numeric
 * ADO work item ID needed for hierarchy linking, and to find the local directory
 * where all story artefacts are saved.
 *
 * Map value formats:
 *   number              → plain ADO ID (Epics)
 *   { adoId, dir }      → ADO ID + absolute path to the story folder (Stories)
 *
 * File is committed alongside story artefacts so the mapping survives across
 * sessions and is shared with teammates.
 */
const fs   = require('fs');
const path = require('path');

function mapPath(repoRoot) {
  return path.join(repoRoot, '.evyasys', '.ado-map.json');
}

function read(repoRoot) {
  const file = mapPath(repoRoot);
  if (!fs.existsSync(file)) return {};
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; }
}

/**
 * Persist one or more Evyasys ID → ADO entries.
 * Values may be plain numbers (Epics) or { adoId, dir } objects (Stories).
 * @param {string} repoRoot
 * @param {Record<string, number|{adoId:number, dir:string}>} entries
 */
function save(repoRoot, entries) {
  const file = mapPath(repoRoot);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const updated = { ...read(repoRoot), ...entries };
  fs.writeFileSync(file, JSON.stringify(updated, null, 2) + '\n', 'utf8');
}

/**
 * Return the ADO numeric ID for a given Evyasys ID, or null if not found.
 * Handles both plain-number values (Epics) and { adoId, dir } objects (Stories).
 * @param {string} repoRoot
 * @param {string} evyasysId
 * @returns {number|null}
 */
function lookup(repoRoot, evyasysId) {
  const val = read(repoRoot)[evyasysId];
  if (val == null) return null;
  return typeof val === 'object' ? (val.adoId ?? null) : val;
}

/**
 * Return the absolute local directory path saved for a story, or null if not found.
 * Only populated for Stories (not Epics).
 * @param {string} repoRoot
 * @param {string} evyasysId
 * @returns {string|null}
 */
function lookupDir(repoRoot, evyasysId) {
  const val = read(repoRoot)[evyasysId];
  return (val && typeof val === 'object') ? (val.dir ?? null) : null;
}

module.exports = { save, lookup, lookupDir };

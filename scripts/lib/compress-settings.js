/**
 * Persistent compress settings — ~/.evyasys/settings.json
 *
 * Stores the user's compression preference and installed engine version.
 * This file is NEVER modified by plugin updates — it belongs to the user's
 * machine, not the plugin. The only time it changes is when the user
 * explicitly enables, disables, or updates compression via Setup or Update.
 *
 * Schema:
 * {
 *   "compress": {
 *     "enabled": true,
 *     "version": "1.2.3",
 *     "updated_at": "2026-06-21"
 *   }
 * }
 */
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const SETTINGS_FILE = path.join(os.homedir(), '.evyasys', 'settings.json');

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return {};
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeSettings(updates) {
  try {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    const current = readSettings();
    const merged  = deepMerge(current, updates);
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2) + '\n', 'utf8');
    return true;
  } catch { return false; }
}

function readCompressSettings() {
  return readSettings().compress || null;
}

function writeCompressSettings(data) {
  return writeSettings({ compress: { ...data, updated_at: new Date().toISOString().slice(0, 10) } });
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && result[k] && typeof result[k] === 'object') {
      result[k] = deepMerge(result[k], v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

module.exports = { readCompressSettings, writeCompressSettings, SETTINGS_FILE };

/**
 * Session-start hook for Evyasys.
 *
 * Loads the layered project context that every /Evya* command depends on:
 *   1. Plugin defaults  (this folder's .ai/{rules,memory,integrations,workflows})
 *   2. Project overlay  (the user's project: .evyasys/{project.yaml, rules, memory, workflows, inputs})
 *   3. User credentials (~/.evyasys/credentials)
 *
 * Project overlay wins over plugin defaults for any same-named file.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { loadConfig } = require('../scripts/lib/config');

function readDir(dir, exts = ['.md', '.json', '.yaml', '.yml']) {
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(out, readDir(full, exts));
    else if (exts.includes(path.extname(entry.name))) out[full] = fs.readFileSync(full, 'utf8');
  }
  return out;
}

module.exports = async function (ctx) {
  const cfg = await loadConfig({ ctx });

  // Plugin layer (defaults)
  const pluginRules = readDir(path.join(cfg.pluginRoot, '.ai', 'rules'));
  const pluginIntegrations = readDir(path.join(cfg.pluginRoot, '.ai', 'integrations'));
  const pluginWorkflows = readDir(path.join(cfg.pluginRoot, '.ai', 'workflows'));
  const pluginMemoryPath = path.join(cfg.pluginRoot, '.ai', 'memory', 'evyaflow.json');
  const pluginMemory = fs.existsSync(pluginMemoryPath) ? fs.readFileSync(pluginMemoryPath, 'utf8') : '{}';

  // Project overlay
  const projectDir = path.join(cfg.repoRoot, '.evyasys');
  const projectRules = readDir(path.join(projectDir, 'rules'));
  const projectWorkflows = readDir(path.join(projectDir, 'workflows'));
  const projectInputs = readDir(path.join(projectDir, 'inputs'));
  const projectMemory = readDir(path.join(projectDir, 'memory'));

  // Repo scan summary (best effort)
  let repoScan = '';
  try {
    const py = spawnSync('python', [path.join(cfg.pluginRoot, 'scripts', 'repo_scan.py'), '--summary'], {
      cwd: cfg.repoRoot, timeout: 15000, encoding: 'utf8',
    });
    repoScan = py.stdout || py.stderr || '';
  } catch (e) {
    repoScan = `(repo_scan unavailable: ${e.message})`;
  }

  const context = {
    'evyasys.mode': cfg.dryRun ? 'dry-run' : 'live',
    'evyasys.project': cfg.project,
    'evyasys.rules.plugin': pluginRules,
    'evyasys.rules.project': projectRules,
    'evyasys.integrations': pluginIntegrations,
    'evyasys.workflows.plugin': pluginWorkflows,
    'evyasys.workflows.project': projectWorkflows,
    'evyasys.memory.plugin': pluginMemory,
    'evyasys.memory.project': projectMemory,
    'evyasys.inputs': projectInputs,
    'evyasys.repoScan': repoScan,
  };

  if (typeof ctx.injectContext === 'function') await ctx.injectContext(context);
  else if (ctx.context) Object.assign(ctx.context, context);

  if (typeof ctx.send === 'function') {
    const projName = (cfg.project && cfg.project.name) || '(no .evyasys/project.yaml)';
    ctx.send(`Evyasys loaded — project: ${projName}, mode: ${context['evyasys.mode']}.`);
  }
};

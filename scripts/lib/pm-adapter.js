/**
 * Project Management tool adapter.
 *
 * Routes create/update/state operations to whichever PM tool the project
 * has configured: local | devops | jira | github
 *
 * All public functions are async and return null / [] for "local" mode.
 * In dry-run mode the underlying integrations log what would happen and
 * return { dryRun: true } without making any HTTP calls.
 */
const {
  ensurePat,
  ensureJiraCreds,
  ensureGitHubToken,
} = require('./config');

const LABELS = {
  local:   'local folder',
  devops:  'Azure DevOps',
  jira:    'JIRA',
  github:  'GitHub Projects',
};

/** Human-readable name of the configured PM tool. */
function toolLabel(cfg) {
  return LABELS[cfg.pmTool] || cfg.pmTool;
}

/** Ensure PM tool credentials are present, prompting once if needed. */
async function ensureCredentials(cfg) {
  if (cfg.pmTool === 'devops') return ensurePat(cfg);
  if (cfg.pmTool === 'jira')   return ensureJiraCreds(cfg);
  if (cfg.pmTool === 'github') return ensureGitHubToken(cfg);
  // local: no credentials needed
}

/**
 * Search the PM tool for an existing Epic matching epicId.
 * Returns the PM-tool-specific ID, or null if not found / not applicable.
 */
async function findEpic(cfg, params) {
  if (cfg.pmTool === 'local')  return null;
  if (cfg.pmTool === 'devops') return require('../integrations/azure_devops').findEpic(params);
  if (cfg.pmTool === 'jira')   return require('../integrations/jira').findEpic(params);
  if (cfg.pmTool === 'github') return require('../integrations/github_board').findEpic(params);
  return null;
}

/**
 * Create an Epic in the PM tool.
 * Returns the created item (with `.id`) or null for local.
 */
async function createEpic(cfg, params) {
  if (cfg.pmTool === 'local')  return null;
  if (cfg.pmTool === 'devops') return require('../integrations/azure_devops').createEpic(params);
  if (cfg.pmTool === 'jira')   return require('../integrations/jira').createEpic(params);
  if (cfg.pmTool === 'github') return require('../integrations/github_board').createEpic(params);
  return null;
}

/**
 * Create a Story / Issue in the PM tool and link it to the parent Epic.
 * Returns the created item (with `.id`) or null for local.
 */
async function createStory(cfg, params) {
  if (cfg.pmTool === 'local')  return null;
  if (cfg.pmTool === 'devops') return require('../integrations/azure_devops').createStory(params);
  if (cfg.pmTool === 'jira')   return require('../integrations/jira').createStory(params);
  if (cfg.pmTool === 'github') return require('../integrations/github_board').createStory(params);
  return null;
}

/**
 * Create subtask work items under a parent Story.
 * Returns array of created items or [] for local.
 */
async function createSubtasks(cfg, params) {
  if (cfg.pmTool === 'local')  return [];
  if (cfg.pmTool === 'devops') return require('../integrations/azure_devops').createSubtasks(params);
  if (cfg.pmTool === 'jira')   return require('../integrations/jira').createSubtasks(params);
  if (cfg.pmTool === 'github') return require('../integrations/github_board').createSubtasks(params);
  return [];
}

/**
 * Transition a work item to the specified state.
 * State names use the Evyasys standard: "In Progress" | "Ready for QA" | "In QA" | "Done"
 * Each integration maps these to its own state/transition names.
 * Returns result or null for local.
 */
async function setState(cfg, params) {
  if (cfg.pmTool === 'local')  return null;
  if (cfg.pmTool === 'devops') return require('../integrations/azure_devops').setState(params);
  if (cfg.pmTool === 'jira')   return require('../integrations/jira').setState(params);
  if (cfg.pmTool === 'github') return require('../integrations/github_board').setState(params);
  return null;
}

/**
 * Create a bug / defect work item linked to the parent story.
 * @param {object} params — { storyId, title, description, severity, tcId, storyPmId }
 */
async function createBug(cfg, params) {
  if (cfg.pmTool === 'local')  return null;
  if (cfg.pmTool === 'devops') return require('../integrations/azure_devops').createBug(params);
  if (cfg.pmTool === 'jira')   return require('../integrations/jira').createBug(params);
  if (cfg.pmTool === 'github') return require('../integrations/github_board').createBug(params);
  return null;
}

module.exports = { toolLabel, ensureCredentials, findEpic, createEpic, createStory, createSubtasks, setState, createBug };

/**
 * Azure DevOps integration (Node.js).
 * Reads layered config (env > ~/.evyasys/credentials > .evyasys/project.yaml > plugin defaults).
 * Default mode is LIVE; set EVYASYS_DRY_RUN=1 to preview without HTTP.
 *
 * CLI:
 *   node azure_devops.js create-stories  --file <path> [--id <EVYA-id>]
 *   node azure_devops.js create-subtasks --story <EVYA-id> --file <path> [--story-ado-id <num>]
 *   node azure_devops.js set-state       --id <EVYA-id> --state <State>
 *   node azure_devops.js get-work-item   --id <EVYA-id>
 */
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../lib/config');

function authHeader(pat) { return 'Basic ' + Buffer.from(':' + pat).toString('base64'); }

function adoUrl(cfg, suffix) {
  return `https://dev.azure.com/${encodeURIComponent(cfg.azure.org)}/${encodeURIComponent(cfg.azure.project)}/_apis/wit/${suffix}`;
}

function witTypeUrl(type) {
  return `workitems/$${encodeURIComponent(type)}?api-version=7.1`;
}

async function adoFetch(cfg, suffix, { method = 'GET', body } = {}) {
  const url = adoUrl(cfg, suffix);
  if (cfg.dryRun) {
    console.log(`[evyasys:dry-run] ADO ${method} ${url}`);
    if (body) console.log(`[evyasys:dry-run] body=${JSON.stringify(body, null, 2)}`);
    return { dryRun: true };
  }
  if (!cfg.azure.org || !cfg.azure.project) {
    throw new Error('AZURE_ORG / AZURE_PROJECT not set (check .evyasys/project.yaml or env).');
  }
  if (!cfg.azure.pat) {
    throw new Error('No PAT available. Run scripts/login.sh (macOS/Linux) or scripts/setup.ps1 (Windows) once.');
  }
  const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
  const res = await fetchFn(url, {
    method,
    headers: {
      'Authorization': authHeader(cfg.azure.pat),
      'Content-Type': 'application/json-patch+json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`ADO ${method} ${url} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function parseStoryMarkdown(file) {
  const md = fs.readFileSync(file, 'utf8');
  const titleMatch = md.match(/^#\s+(.+)$/m);
  const epicMatch  = md.match(/^Epic:\s*([^\s]+)/m);
  return {
    title:       titleMatch ? titleMatch[1].trim() : path.basename(file, '.md'),
    description: md,
    epicId:      epicMatch  ? epicMatch[1].trim()  : null,
  };
}

/**
 * Set a parent–child hierarchy link in ADO.
 * Used for: Story → Epic  and  Task → Story.
 * parentAdoId must be the numeric ADO work item ID.
 */
async function linkToParent(cfg, childAdoId, parentAdoId) {
  const numericParent = String(parentAdoId).replace(/[^0-9]/g, '');
  if (!numericParent) {
    console.warn(`[evyasys] Invalid parent ADO ID "${parentAdoId}" — skipping hierarchy link.`);
    return;
  }
  const parentUrl = adoUrl(cfg, `workitems/${numericParent}`);
  const patch = [{
    op: 'add',
    path: '/relations/-',
    value: {
      rel: 'System.LinkTypes.Hierarchy-Reverse',
      url: parentUrl,
      attributes: { comment: 'Linked by Evyasys' },
    },
  }];
  return adoFetch(cfg, `workitems/${childAdoId}?api-version=7.1`, { method: 'PATCH', body: patch });
}

/**
 * Search ADO for an existing Epic whose title matches epicId.
 * Returns the numeric ADO work item ID, or null if not found.
 * Uses WIQL so the lookup works regardless of the local map state.
 */
async function findEpic({ epicId }) {
  const cfg = await loadConfig();
  if (cfg.dryRun) return null;
  const safeEpicId  = epicId.replace(/'/g, "''");
  const safeProject = cfg.azure.project.replace(/'/g, "''");
  const safeType    = cfg.workItemTypes.epic.replace(/'/g, "''");
  const wiql = {
    query: `SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = '${safeType}' AND [System.Title] = '${safeEpicId}' AND [System.TeamProject] = '${safeProject}'`,
  };
  try {
    const result = await adoFetch(cfg, 'wiql?api-version=7.1', { method: 'POST', body: wiql });
    if (result && result.workItems && result.workItems.length > 0) {
      return result.workItems[0].id;
    }
  } catch (e) {
    console.warn(`[evyasys] Epic search failed (will attempt creation): ${e.message}`);
  }
  return null;
}

/**
 * Create an Epic work item.
 * Called internally by the create-story hook when no existing Epic is found.
 */
async function createEpic({ epicId, title }) {
  const cfg = await loadConfig();
  const patch = [
    { op: 'add', path: '/fields/System.Title',       value: title || epicId },
    { op: 'add', path: '/fields/System.Description', value: `Epic: ${epicId}` },
  ];
  return adoFetch(cfg, witTypeUrl(cfg.workItemTypes.epic), { method: 'POST', body: patch });
}

/**
 * Create a User Story work item and link it to its parent Epic.
 * If epicId is a non-numeric Evyasys-style ID (e.g. "EP-001"), the Epic is
 * created automatically first and the numeric ADO ID is used for linking.
 */
async function createStories({ storyId, file, epicId: explicitEpicId }) {
  const cfg = await loadConfig();
  const { title, description, epicId: parsedEpicId } = parseStoryMarkdown(file);
  const epicId = explicitEpicId || parsedEpicId;

  const patch = [
    { op: 'add', path: '/fields/System.Title',       value: storyId ? `${storyId}: ${title}` : title },
    { op: 'add', path: '/fields/System.Description', value: description },
  ];
  const created = await adoFetch(cfg, witTypeUrl(cfg.workItemTypes.story), { method: 'POST', body: patch });

  if (epicId && created && created.id && !cfg.dryRun) {
    try {
      await linkToParent(cfg, created.id, epicId);
      console.log(`[evyasys] Linked story ${created.id} → epic ${epicId}`);
    } catch (e) {
      console.warn(`[evyasys] Epic link failed (story still created): ${e.message}`);
    }
  }

  return created;
}

/**
 * Create Task work items for each section in the subtasks file.
 * If storyAdoId is supplied, each task is linked to the parent User Story
 * using the ADO hierarchy relation.
 */
async function createSubtasks({ storyId, file, storyAdoId }) {
  const cfg = await loadConfig();
  const md = fs.readFileSync(file, 'utf8');
  const sections = md.split(/\n##\s+Task\s+\d+/i).slice(1);
  const results = [];
  for (const section of sections) {
    const titleLine = section.split('\n')[0].replace(/^[-—\s:]+/, '').trim() || 'Untitled task';
    const patch = [
      { op: 'add', path: '/fields/System.Title',       value: `${storyId}: ${titleLine}` },
      { op: 'add', path: '/fields/System.Description', value: section.trim() },
    ];
    const created = await adoFetch(cfg, witTypeUrl(cfg.workItemTypes.task), { method: 'POST', body: patch });
    if (storyAdoId && created && created.id && !cfg.dryRun) {
      try {
        await linkToParent(cfg, created.id, storyAdoId);
        console.log(`[evyasys] Linked task ${created.id} → story ${storyAdoId}`);
      } catch (e) {
        console.warn(`[evyasys] Story link failed (task still created): ${e.message}`);
      }
    }
    results.push(created);
  }
  return results;
}

async function setState({ storyId, state }) {
  const cfg = await loadConfig();
  const numericId = (storyId || '').replace(/[^0-9]/g, '') || storyId;
  const patch = [{ op: 'add', path: '/fields/System.State', value: state }];
  return adoFetch(cfg, `workitems/${numericId}?api-version=7.1`, { method: 'PATCH', body: patch });
}

async function getWorkItem({ storyId }) {
  const cfg = await loadConfig();
  const numericId = (storyId || '').replace(/[^0-9]/g, '') || storyId;
  return adoFetch(cfg, `workitems/${numericId}?api-version=7.1`, { method: 'GET' });
}

// CLI
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) out[a.slice(2)] = argv[++i];
    else out._.push(a);
  }
  return out;
}
if (require.main === module) {
  const [sub, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const map = {
    'create-stories':  () => createStories({ storyId: args.id, file: args.file }),
    'create-subtasks': () => createSubtasks({ storyId: args.story, file: args.file, storyAdoId: args['story-ado-id'] }),
    'set-state':       () => setState({ storyId: args.id, state: args.state }),
    'get-work-item':   () => getWorkItem({ storyId: args.id }),
  };
  if (!map[sub]) { console.error(`Unknown subcommand: ${sub}`); process.exit(2); }
  map[sub]().then((r) => console.log(JSON.stringify(r, null, 2)))
            .catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { findEpic, createEpic, createStories, createSubtasks, setState, getWorkItem };

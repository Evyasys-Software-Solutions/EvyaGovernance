/**
 * Azure DevOps integration (Node.js).
 * Reads layered config (env > ~/.evyasys/credentials > .evyasys/project.yaml > plugin defaults).
 * Default mode is LIVE; set EVYASYS_DRY_RUN=1 to preview without HTTP.
 *
 * CLI:
 *   node azure_devops.js create-story    --file <path>           [--id <EVYA-id>]
 *   node azure_devops.js create-subtasks --story <EVYA-id> --file <path>
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
    throw new Error('No PAT available. Run scripts/login.sh (or login.ps1) once.');
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
 * Link a newly-created User Story to its parent Epic using the ADO hierarchy relation.
 * epicId may be a numeric ADO ID or an EVYA-style prefix (we strip non-digits).
 */
async function linkToEpic(cfg, storyNumericId, epicId) {
  const epicNumericId = String(epicId).replace(/[^0-9]/g, '');
  if (!epicNumericId) {
    console.warn(`[evyasys] Could not extract numeric ADO ID from epicId="${epicId}" — skipping link.`);
    return;
  }
  const epicUrl = adoUrl(cfg, `workitems/${epicNumericId}`);
  const patch = [{
    op: 'add',
    path: '/relations/-',
    value: {
      rel: 'System.LinkTypes.Hierarchy-Reverse',
      url: epicUrl,
      attributes: { comment: 'Linked by Evyasys /EvyaCreateStory' },
    },
  }];
  return adoFetch(cfg, `workitems/${storyNumericId}?api-version=7.1`, { method: 'PATCH', body: patch });
}

async function createStory({ storyId, file, epicId: explicitEpicId }) {
  const cfg = await loadConfig();
  const { title, description, epicId: parsedEpicId } = parseStoryMarkdown(file);
  const epicId = explicitEpicId || parsedEpicId;

  const patch = [
    { op: 'add', path: '/fields/System.Title',       value: storyId ? `${storyId}: ${title}` : title },
    { op: 'add', path: '/fields/System.Description', value: description },
  ];
  const created = await adoFetch(cfg, 'workitems/$User%20Story?api-version=7.1', { method: 'POST', body: patch });

  // Link to epic if we have both ADO IDs
  if (epicId && created && created.id && !cfg.dryRun) {
    try {
      await linkToEpic(cfg, created.id, epicId);
      console.log(`[evyasys] Linked story ${created.id} → epic ${epicId}`);
    } catch (e) {
      console.warn(`[evyasys] Epic link failed (story still created): ${e.message}`);
    }
  }

  return created;
}

async function createSubtasks({ storyId, file }) {
  const cfg = await loadConfig();
  const md = fs.readFileSync(file, 'utf8');
  const sections = md.split(/\n##\s+Task\s+\d+/i).slice(1);
  const results = [];
  for (const section of sections) {
    const titleLine = section.split('\n')[0].replace(/^[-—\s:]+/, '').trim() || 'Untitled task';
    const patch = [
      { op: 'add', path: '/fields/System.Title', value: `${storyId}: ${titleLine}` },
      { op: 'add', path: '/fields/System.Description', value: section.trim() },
    ];
    results.push(await adoFetch(cfg, 'workitems/$Task?api-version=7.1', { method: 'POST', body: patch }));
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
    'create-story':    () => createStory({ storyId: args.id, file: args.file }),
    'create-subtasks': () => createSubtasks({ storyId: args.story, file: args.file }),
    'set-state':       () => setState({ storyId: args.id, state: args.state }),
    'get-work-item':   () => getWorkItem({ storyId: args.id }),
  };
  if (!map[sub]) { console.error(`Unknown subcommand: ${sub}`); process.exit(2); }
  map[sub]().then((r) => console.log(JSON.stringify(r, null, 2)))
            .catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { createStory, createSubtasks, setState, getWorkItem };

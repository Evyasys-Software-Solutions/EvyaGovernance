/**
 * JIRA REST API v3 integration for Evyasys.
 *
 * Reads config from loadConfig() — jira.domain, jira.projectKey,
 * jira.email, jira.apiToken (all resolved by the layered config loader).
 *
 * State mapping (Evyasys → JIRA transition names):
 *   "In Progress"  → "In Progress" | "Start Progress"
 *   "Ready for QA" → "Ready for Review" | "In Review" | "Code Review"
 *   "In QA"        → "In Testing" | "Testing" | "QA"
 *   "Done"         → "Done" | "Resolve Issue" | "Close Issue"
 *
 * CLI:
 *   node jira.js create-story    --file <path> [--id <EVYA-id>] [--epic-id <key>]
 *   node jira.js create-subtasks --story <EVYA-id> --file <path> [--story-id <key>]
 *   node jira.js set-state       --id <issue-key> --state <state>
 *   node jira.js find-epic       --id <epicId>
 */
const fs   = require('fs');
const path = require('path');
const { loadConfig } = require('../lib/config');
const { markdownToHtml } = require('../lib/markdown-to-html');

function authHeader(cfg) {
  return 'Basic ' + Buffer.from(`${cfg.jira.email}:${cfg.jira.apiToken}`).toString('base64');
}

function baseUrl(cfg) {
  const domain = cfg.jira.domain.replace(/\/$/, '');
  return `https://${domain}/rest/api/3`;
}

async function jiraFetch(cfg, endpoint, { method = 'GET', body } = {}) {
  const url = `${baseUrl(cfg)}${endpoint}`;
  if (cfg.dryRun) {
    console.log(`[evyasys:dry-run] JIRA ${method} ${url}`);
    if (body) console.log(`[evyasys:dry-run] body=${JSON.stringify(body, null, 2)}`);
    return { dryRun: true };
  }
  if (!cfg.jira.domain || !cfg.jira.email || !cfg.jira.apiToken) {
    throw new Error('JIRA credentials not set. Run /evyasys:Setup to configure JIRA.');
  }
  const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
  const res = await fetchFn(url, {
    method,
    headers: {
      'Authorization': authHeader(cfg),
      'Content-Type':  'application/json',
      'Accept':        'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`JIRA ${method} ${endpoint} failed: ${res.status} ${await res.text()}`);
  return method === 'DELETE' ? {} : res.json();
}

/** Convert a plain-text description to JIRA Atlassian Document Format (ADF). */
function toAdf(text) {
  return {
    version: 1,
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{ type: 'text', text: text || '' }],
    }],
  };
}

/** Find a JIRA transition ID whose name matches (case-insensitive partial). */
async function findTransition(cfg, issueKey, stateName) {
  const result = await jiraFetch(cfg, `/issue/${issueKey}/transitions`);
  if (!result || !result.transitions) return null;
  const norm = stateName.toLowerCase();
  // Try exact match first, then partial.
  const exact = result.transitions.find(t => t.name.toLowerCase() === norm);
  if (exact) return exact.id;
  const partial = result.transitions.find(t => t.name.toLowerCase().includes(norm.split(' ')[0]));
  return partial ? partial.id : null;
}

const STATE_CANDIDATES = {
  'In Progress':  ['In Progress', 'Start Progress', 'Start Development', 'In Development'],
  'Ready for QA': ['Ready for Review', 'In Review', 'Code Review', 'Ready for QA'],
  'In QA':        ['In Testing', 'Testing', 'QA', 'In QA'],
  'Done':         ['Done', 'Resolve Issue', 'Close Issue', 'Closed', 'Resolved'],
};

async function findBestTransition(cfg, issueKey, targetState) {
  const result = await jiraFetch(cfg, `/issue/${issueKey}/transitions`);
  if (!result || !result.transitions) return null;
  const candidates = STATE_CANDIDATES[targetState] || [targetState];
  for (const name of candidates) {
    const match = result.transitions.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (match) return match.id;
  }
  // Partial match fallback.
  const first = (candidates[0] || targetState).toLowerCase();
  const fallback = result.transitions.find(t => t.name.toLowerCase().includes(first.split(' ')[0]));
  return fallback ? fallback.id : null;
}

function parseStoryMarkdown(file) {
  const md = fs.readFileSync(file, 'utf8');
  const titleMatch = md.match(/^#\s+(.+)$/m);
  const epicMatch  = md.match(/^Epic:\s*([^\s]+)/m);
  const spMatch    = md.match(/^Story[\s-]?Points:\s*(\d+)/im);
  return {
    title:       titleMatch ? titleMatch[1].trim() : path.basename(file, '.md'),
    content:     md,
    epicKey:     epicMatch  ? epicMatch[1].trim()  : null,
    storyPoints: spMatch    ? parseInt(spMatch[1], 10) : null,
  };
}

async function findEpic({ epicId }) {
  const cfg = await loadConfig();
  if (cfg.dryRun) return null;
  if (!cfg.jira.projectKey) return null;
  try {
    const jql = `project = "${cfg.jira.projectKey}" AND issuetype = Epic AND summary ~ "${epicId}" ORDER BY created DESC`;
    const result = await jiraFetch(cfg, `/search?jql=${encodeURIComponent(jql)}&maxResults=1&fields=summary`);
    if (result && result.issues && result.issues.length > 0) {
      return result.issues[0].key;
    }
  } catch (e) {
    console.warn(`[evyasys] JIRA Epic search failed: ${e.message}`);
  }
  return null;
}

async function createEpic({ epicId, title }) {
  const cfg = await loadConfig();
  const body = {
    fields: {
      project:   { key: cfg.jira.projectKey },
      issuetype: { name: 'Epic' },
      summary:   title || epicId,
      description: toAdf(`Epic ID: ${epicId}`),
    },
  };
  return jiraFetch(cfg, '/issue', { method: 'POST', body });
}

async function createStory({ storyId, file, epicId }) {
  const cfg = await loadConfig();
  const { title, content, epicKey: parsedEpicKey, storyPoints } = parseStoryMarkdown(file);
  const epicKey = epicId || parsedEpicKey;

  const fields = {
    project:     { key: cfg.jira.projectKey },
    issuetype:   { name: 'Story' },
    summary:     storyId ? `${storyId}: ${title}` : title,
    description: toAdf(content),
  };
  if (epicKey) {
    fields['parent'] = { key: epicKey };
  }
  if (storyPoints !== null) {
    // customfield_10016 is the standard Story Points field in JIRA Cloud.
    fields['customfield_10016'] = storyPoints;
  }
  return jiraFetch(cfg, '/issue', { method: 'POST', body: { fields } });
}

async function createSubtasks({ storyId, file, storyAdoId: parentKey }) {
  const cfg  = await loadConfig();
  const md   = fs.readFileSync(file, 'utf8');
  const sections = md.split(/\n##\s+Task\s+\d+/i).slice(1);
  const results  = [];
  for (const section of sections) {
    const titleLine = section.split('\n')[0].replace(/^[-—\s:]+/, '').trim() || 'Untitled task';
    const body = section.split('\n').slice(1).join('\n').trim();
    const fields = {
      project:     { key: cfg.jira.projectKey },
      issuetype:   { name: 'Sub-task' },
      summary:     `${storyId}: ${titleLine}`,
      description: toAdf(body),
    };
    if (parentKey) fields['parent'] = { key: String(parentKey) };
    const created = await jiraFetch(cfg, '/issue', { method: 'POST', body: { fields } });
    results.push(created);
  }
  return results;
}

/**
 * Create a Bug issue linked to a parent story.
 * @param {object} params — { storyId, title, description, severity, tcId, storyPmId }
 * severity: 1=Critical, 2=High, 3=Medium, 4=Low
 */
async function createBug({ storyId, title, description, severity = 3, tcId, storyPmId }) {
  const cfg = await loadConfig();
  const priorityMap = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' };
  const priority = priorityMap[severity] || 'Medium';
  const bugTitle = tcId ? `[${tcId}] ${title}` : title;
  const repro = description || `Bug found during QA for story ${storyId}${tcId ? ` (${tcId})` : ''}.`;

  const fields = {
    project:     { key: cfg.jira.projectKey },
    issuetype:   { name: 'Bug' },
    summary:     bugTitle,
    description: toAdf(repro),
    priority:    { name: priority },
  };
  if (storyPmId) {
    fields['parent'] = { key: String(storyPmId) };
  }
  return jiraFetch(cfg, '/issue', { method: 'POST', body: { fields } });
}

async function setState({ storyId, state }) {
  const cfg = await loadConfig();
  if (cfg.dryRun) {
    console.log(`[evyasys:dry-run] JIRA transition ${storyId} → "${state}"`);
    return { dryRun: true };
  }
  const transitionId = await findBestTransition(cfg, storyId, state);
  if (!transitionId) {
    console.warn(`[evyasys] JIRA: no matching transition for "${state}" on ${storyId} — skipping state change.`);
    return null;
  }
  return jiraFetch(cfg, `/issue/${storyId}/transitions`, {
    method: 'POST',
    body:   { transition: { id: transitionId } },
  });
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
    'create-story':    () => createStory({ storyId: args.id, file: args.file, epicId: args['epic-id'] }),
    'create-subtasks': () => createSubtasks({ storyId: args.story, file: args.file, storyAdoId: args['story-id'] }),
    'set-state':       () => setState({ storyId: args.id, state: args.state }),
    'find-epic':       () => findEpic({ epicId: args.id }),
    'create-bug':      () => createBug({ storyId: args['story-id'], title: args.title, description: args.description, severity: args.severity ? parseInt(args.severity, 10) : 3, tcId: args['tc-id'], storyPmId: args['story-pm-id'] }),
  };
  if (!map[sub]) { console.error(`Unknown subcommand: ${sub}`); process.exit(2); }
  map[sub]().then(r => console.log(JSON.stringify(r, null, 2))).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { findEpic, createEpic, createStory, createSubtasks, setState, createBug };

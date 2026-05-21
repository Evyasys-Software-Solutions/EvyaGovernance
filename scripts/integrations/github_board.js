/**
 * GitHub Issues + Projects v2 integration for Evyasys.
 *
 * Reads config from loadConfig() — github.owner, github.repo,
 * github.projectNumber, github.token (all resolved by the layered config loader).
 *
 * Issue states are tracked via labels:
 *   "In Progress"  → label "in-progress"
 *   "Ready for QA" → label "ready-for-qa"
 *   "In QA"        → label "in-qa"
 *   "Done"         → issue closed
 *
 * CLI:
 *   node github_board.js create-story    --file <path> [--id <EVYA-id>] [--epic-id <num>]
 *   node github_board.js create-subtasks --story <EVYA-id> --file <path> [--parent <num>]
 *   node github_board.js set-state       --id <issue-num> --state <state>
 *   node github_board.js find-epic       --id <epicId>
 */
const fs   = require('fs');
const path = require('path');
const { loadConfig } = require('../lib/config');

function authHeader(cfg) {
  return `Bearer ${cfg.github.token}`;
}

function repoApiBase(cfg) {
  return `https://api.github.com/repos/${cfg.github.owner}/${cfg.github.repo}`;
}

async function ghFetch(cfg, url, { method = 'GET', body } = {}) {
  const fullUrl = url.startsWith('http') ? url : `${repoApiBase(cfg)}${url}`;
  if (cfg.dryRun) {
    console.log(`[evyasys:dry-run] GitHub ${method} ${fullUrl}`);
    if (body) console.log(`[evyasys:dry-run] body=${JSON.stringify(body, null, 2)}`);
    return { dryRun: true };
  }
  if (!cfg.github.owner || !cfg.github.repo || !cfg.github.token) {
    throw new Error('GitHub credentials not set. Run /evyasys:Setup to configure GitHub.');
  }
  const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
  const res = await fetchFn(fullUrl, {
    method,
    headers: {
      'Authorization': authHeader(cfg),
      'Content-Type':  'application/json',
      'Accept':        'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`GitHub ${method} ${url} failed: ${res.status} ${await res.text()}`);
  return method === 'DELETE' ? {} : res.json();
}

const STATE_LABELS = {
  'In Progress':  'in-progress',
  'Ready for QA': 'ready-for-qa',
  'In QA':        'in-qa',
};

/** Ensure a label exists in the repo (creates it if absent). */
async function ensureLabel(cfg, name, color = 'ededed') {
  try {
    await ghFetch(cfg, `/labels/${encodeURIComponent(name)}`);
  } catch {
    await ghFetch(cfg, '/labels', { method: 'POST', body: { name, color } });
  }
}

function parseStoryMarkdown(file) {
  const md = fs.readFileSync(file, 'utf8');
  const titleMatch = md.match(/^#\s+(.+)$/m);
  const epicMatch  = md.match(/^Epic:\s*([^\s]+)/m);
  return {
    title:   titleMatch ? titleMatch[1].trim() : path.basename(file, '.md'),
    content: md,
    epicRef: epicMatch  ? epicMatch[1].trim()  : null,
  };
}

async function findEpic({ epicId }) {
  const cfg = await loadConfig();
  if (cfg.dryRun) return null;
  try {
    const result = await ghFetch(cfg, `/issues?labels=epic&state=open&per_page=50`);
    if (!Array.isArray(result)) return null;
    const match = result.find(i =>
      i.title.includes(epicId) || (i.body && i.body.includes(epicId))
    );
    return match ? match.number : null;
  } catch (e) {
    console.warn(`[evyasys] GitHub Epic search failed: ${e.message}`);
    return null;
  }
}

async function createEpic({ epicId, title }) {
  const cfg = await loadConfig();
  await ensureLabel(cfg, 'epic', '3E4B9E');
  return ghFetch(cfg, '/issues', {
    method: 'POST',
    body: {
      title: title || epicId,
      body:  `**Epic ID:** ${epicId}`,
      labels: ['epic'],
    },
  });
}

async function createStory({ storyId, file, epicId }) {
  const cfg = await loadConfig();
  const { title, content, epicRef } = parseStoryMarkdown(file);
  await ensureLabel(cfg, 'story', '0075CA');
  const issue = await ghFetch(cfg, '/issues', {
    method: 'POST',
    body: {
      title:  storyId ? `${storyId}: ${title}` : title,
      body:   content,
      labels: ['story'],
    },
  });
  // Add to GitHub Project if projectNumber is configured.
  if (cfg.github.projectNumber && issue && issue.node_id) {
    await addToProject(cfg, issue.node_id).catch(e =>
      console.warn(`[evyasys] GitHub Projects add failed (issue still created): ${e.message}`)
    );
  }
  // Note the epic link in a comment if an epic number is available.
  const epicNum = epicId || (epicRef ? await findEpic({ epicId: epicRef }) : null);
  if (epicNum && issue && issue.number && !cfg.dryRun) {
    await ghFetch(cfg, `/issues/${issue.number}/comments`, {
      method: 'POST',
      body: { body: `Part of Epic #${epicNum}` },
    }).catch(() => {});
  }
  return issue;
}

async function addToProject(cfg, nodeId) {
  if (!cfg.github.projectNumber || !cfg.github.owner) return;
  // Get project node ID first via GraphQL.
  const queryRes = await graphqlFetch(cfg, `
    query {
      organization(login: "${cfg.github.owner}") {
        projectV2(number: ${cfg.github.projectNumber}) { id }
      }
    }
  `);
  const projectId = queryRes?.data?.organization?.projectV2?.id;
  if (!projectId) return;
  return graphqlFetch(cfg, `
    mutation {
      addProjectV2ItemById(input: { projectId: "${projectId}" contentId: "${nodeId}" }) {
        item { id }
      }
    }
  `);
}

async function graphqlFetch(cfg, query) {
  if (cfg.dryRun) {
    console.log(`[evyasys:dry-run] GitHub GraphQL: ${query.trim().slice(0, 120)}`);
    return { data: {} };
  }
  const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
  const res = await fetchFn('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': authHeader(cfg),
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

async function createSubtasks({ storyId, file, storyAdoId: parentNumber }) {
  const cfg      = await loadConfig();
  const md       = fs.readFileSync(file, 'utf8');
  const sections = md.split(/\n##\s+Task\s+\d+/i).slice(1);
  const results  = [];
  await ensureLabel(cfg, 'task', 'E4E669');
  for (const section of sections) {
    const titleLine = section.split('\n')[0].replace(/^[-—\s:]+/, '').trim() || 'Untitled task';
    const body = section.split('\n').slice(1).join('\n').trim()
      + (parentNumber ? `\n\nPart of #${parentNumber}` : '');
    const created = await ghFetch(cfg, '/issues', {
      method: 'POST',
      body: {
        title:  `${storyId}: ${titleLine}`,
        body,
        labels: ['task'],
      },
    });
    results.push(created);
  }
  return results;
}

/**
 * Create a Bug issue linked to a parent story.
 * @param {object} params — { storyId, title, description, severity, tcId, storyPmId }
 */
async function createBug({ storyId, title, description, severity = 3, tcId, storyPmId }) {
  const cfg = await loadConfig();
  await ensureLabel(cfg, 'bug', 'D73A4A');
  const severityLabels = { 1: 'severity:critical', 2: 'severity:high', 3: 'severity:medium', 4: 'severity:low' };
  const sevLabel = severityLabels[severity] || 'severity:medium';
  await ensureLabel(cfg, sevLabel, 'FFA500');

  const bugTitle = tcId ? `[${tcId}] ${title}` : title;
  const repro = description || `Bug found during QA for story ${storyId}${tcId ? ` (${tcId})` : ''}.`;
  const body  = `${repro}${storyPmId ? `\n\nLinked story: #${storyPmId}` : ''}`;

  return ghFetch(cfg, '/issues', {
    method: 'POST',
    body: {
      title:  bugTitle,
      body,
      labels: ['bug', sevLabel],
    },
  });
}

async function setState({ storyId, state }) {
  const cfg = await loadConfig();
  const issueNum = String(storyId).replace(/[^0-9]/g, '') || storyId;

  if (cfg.dryRun) {
    console.log(`[evyasys:dry-run] GitHub set state: issue #${issueNum} → "${state}"`);
    return { dryRun: true };
  }

  const stateLabel = STATE_LABELS[state];
  const removeLabels = Object.values(STATE_LABELS);

  // Get current labels.
  const issue = await ghFetch(cfg, `/issues/${issueNum}`);
  if (!issue || issue.dryRun) return issue;

  const currentLabels = (issue.labels || []).map(l => l.name).filter(l => !removeLabels.includes(l));

  if (state === 'Done') {
    // Close the issue.
    return ghFetch(cfg, `/issues/${issueNum}`, { method: 'PATCH', body: { state: 'closed' } });
  }

  // Update labels.
  const newLabels = stateLabel ? [...currentLabels, stateLabel] : currentLabels;
  return ghFetch(cfg, `/issues/${issueNum}`, { method: 'PATCH', body: { labels: newLabels } });
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
    'create-subtasks': () => createSubtasks({ storyId: args.story, file: args.file, storyAdoId: args.parent }),
    'set-state':       () => setState({ storyId: args.id, state: args.state }),
    'find-epic':       () => findEpic({ epicId: args.id }),
    'create-bug':      () => createBug({ storyId: args['story-id'], title: args.title, description: args.description, severity: args.severity ? parseInt(args.severity, 10) : 3, tcId: args['tc-id'], storyPmId: args['story-pm-id'] }),
  };
  if (!map[sub]) { console.error(`Unknown subcommand: ${sub}`); process.exit(2); }
  map[sub]().then(r => console.log(JSON.stringify(r, null, 2))).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { findEpic, createEpic, createStory, createSubtasks, setState, createBug };

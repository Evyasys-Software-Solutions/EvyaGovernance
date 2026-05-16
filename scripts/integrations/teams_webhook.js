/**
 * Microsoft Teams incoming-webhook integration (Node.js).
 * Default mode is LIVE; set EVYASYS_DRY_RUN=1 to preview without HTTP.
 *
 * CLI:
 *   node teams_webhook.js story-created    --file <path>  [--id <id>]
 *   node teams_webhook.js subtasks-created --id <id>      [--count <N>]
 *   node teams_webhook.js dev-kickoff      --id <id>
 *   node teams_webhook.js review-passed    --id <id>
 *   node teams_webhook.js review-no-go     --id <id>
 *   node teams_webhook.js dev-finished     --id <id>
 *   node teams_webhook.js qa-started       --id <id>
 *   node teams_webhook.js qa-finished      --id <id>
 */
const fs = require('fs');
const { loadConfig } = require('../lib/config');

function buildCard({ title, summary, sections, link }) {
  const card = {
    contentType: 'application/vnd.microsoft.teams.card.o365connector',
    content: {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      summary, title, sections,
    },
  };
  if (link) {
    card.content.potentialAction = [{
      '@type': 'OpenUri',
      name: 'Open in Azure DevOps',
      targets: [{ os: 'default', uri: link }],
    }];
  }
  return card;
}

async function post(card) {
  const cfg = await loadConfig();
  if (cfg.dryRun) {
    console.log('[evyasys:dry-run] Teams card:\n' + JSON.stringify(card, null, 2));
    return { dryRun: true };
  }
  if (!cfg.teams.webhook) {
    throw new Error('No Teams webhook configured. Add teams.webhook to .evyasys/project.yaml or set TEAMS_WEBHOOK env var.');
  }
  const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
  const res = await fetchFn(cfg.teams.webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  });
  if (!res.ok) throw new Error('Teams POST failed: ' + res.status + ' ' + (await res.text()));
  return { ok: true };
}

const snippet = (t, max) => {
  if (!t) return '';
  max = max || 600;
  return t.length > max ? t.slice(0, max) + '...' : t;
};

async function storyCreated({ storyId, file }) {
  const md = file ? fs.readFileSync(file, 'utf8') : '';
  return post(buildCard({
    title:    '📋 New Story Ready: ' + storyId,
    summary:  'Story ' + storyId + ' created and pushed to the board.',
    sections: [{ title: 'Preview', text: snippet(md) }],
  }));
}

async function subtasksCreated({ storyId, count }) {
  const countStr = count ? count + ' task' + (count !== 1 ? 's' : '') : 'tasks';
  return post(buildCard({
    title:    '🗂️ Subtasks Ready: ' + storyId,
    summary:  storyId + ' broken into ' + countStr + ' — ready for development.',
    sections: [{ title: 'Status', text: countStr + ' created in Azure DevOps' }],
  }));
}

async function devKickoff({ storyId }) {
  return post(buildCard({
    title:    '🚀 Dev Started: ' + storyId,
    summary:  'Development kicked off for ' + storyId + '.',
    sections: [{ title: 'Status', text: 'In Progress — technical approach agreed' }],
  }));
}

async function reviewPassed({ storyId }) {
  return post(buildCard({
    title:    '✅ Code Review Passed: ' + storyId,
    summary:  storyId + ' passed independent code review.',
    sections: [{ title: 'Status', text: 'Review passed — no Critical issues remaining' }],
  }));
}

async function reviewNoGo({ storyId }) {
  return post(buildCard({
    title:    '❌ Code Review NO-GO: ' + storyId,
    summary:  storyId + ' did not pass code review — Critical items require fixes.',
    sections: [{ title: 'Action Required', text: 'Fix all Critical findings and run /evyasys:ReviewDev again.' }],
  }));
}

async function devFinished({ storyId }) {
  return post(buildCard({
    title:    '🔀 Ready for QA: ' + storyId,
    summary:  'Development complete for ' + storyId + ' — handed off to QA.',
    sections: [{ title: 'Status', text: 'Ready for QA — Dev Summary committed to repo' }],
  }));
}

async function qaStarted({ storyId }) {
  return post(buildCard({
    title:    '🧪 QA Started: ' + storyId,
    summary:  'QA test plan ready for ' + storyId + '.',
    sections: [{ title: 'Status', text: 'In QA — test plan committed to repo' }],
  }));
}

async function qaFinished({ storyId }) {
  return post(buildCard({
    title:    '🚢 Released: ' + storyId,
    summary:  storyId + ' has passed QA and is marked Done.',
    sections: [{ title: 'Status', text: 'Done — release notes committed to repo' }],
  }));
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { out[a.slice(2)] = argv[++i]; }
    else { out._.push(a); }
  }
  return out;
}

if (require.main === module) {
  const sub  = process.argv[2];
  const args = parseArgs(process.argv.slice(3));
  const map  = {
    'story-created':    function() { return storyCreated({ storyId: args.id, file: args.file }); },
    'subtasks-created': function() { return subtasksCreated({ storyId: args.id, count: args.count ? Number(args.count) : undefined }); },
    'dev-kickoff':      function() { return devKickoff({ storyId: args.id }); },
    'review-passed':    function() { return reviewPassed({ storyId: args.id }); },
    'review-no-go':     function() { return reviewNoGo({ storyId: args.id }); },
    'dev-finished':     function() { return devFinished({ storyId: args.id }); },
    'qa-started':       function() { return qaStarted({ storyId: args.id }); },
    'qa-finished':      function() { return qaFinished({ storyId: args.id }); },
  };
  if (!map[sub]) {
    console.error('Unknown subcommand: ' + sub);
    console.error('Valid: ' + Object.keys(map).join(', '));
    process.exit(2);
  }
  map[sub]()
    .then(function(r) { console.log(JSON.stringify(r, null, 2)); })
    .catch(function(e) { console.error(e); process.exit(1); });
}

module.exports = { storyCreated, subtasksCreated, devKickoff, reviewPassed, reviewNoGo, devFinished, qaStarted, qaFinished };

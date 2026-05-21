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

async function bugFound({ storyId, count, criticalCount }) {
  const countStr    = count         ? count + ' bug' + (count !== 1 ? 's' : '')                     : 'bugs';
  const criticalStr = criticalCount ? criticalCount + ' critical/high'                              : '';
  const detail      = criticalStr   ? countStr + ' (' + criticalStr + ') — story remains In QA'    : countStr + ' logged — story marked Done';
  return post(buildCard({
    title:    '🐛 Bugs Found: ' + storyId,
    summary:  'QA found ' + countStr + ' in ' + storyId + '.',
    sections: [{ title: 'Status', text: detail }],
  }));
}

async function releaseGenerated({ storyId, storyCount, version, pdfFile }) {
  const versionStr = version  ? ' · v' + version           : '';
  const countStr   = storyCount ? storyCount + ' stor' + (storyCount !== 1 ? 'ies' : 'y') : '';
  const detail     = [countStr, pdfFile ? 'PDF saved to ' + pdfFile : ''].filter(Boolean).join(' · ') || 'Release notes generated.';
  return post(buildCard({
    title:    '📄 Release Notes: ' + storyId + versionStr,
    summary:  'Release notes generated for ' + storyId + versionStr + '.',
    sections: [{ title: 'Status', text: detail }],
  }));
}

const EVENT_MAP = {
  'story-created':      ({ storyId, file })                        => storyCreated({ storyId, file }),
  'subtasks-created':   ({ storyId, count })                       => subtasksCreated({ storyId, count }),
  'dev-kickoff':        ({ storyId })                              => devKickoff({ storyId }),
  'review-passed':      ({ storyId })                              => reviewPassed({ storyId }),
  'review-no-go':       ({ storyId })                              => reviewNoGo({ storyId }),
  'dev-finished':       ({ storyId })                              => devFinished({ storyId }),
  'qa-started':         ({ storyId })                              => qaStarted({ storyId }),
  'qa-finished':        ({ storyId })                              => qaFinished({ storyId }),
  'bug-found':          ({ storyId, count, criticalCount })        => bugFound({ storyId, count, criticalCount }),
  'release-generated':  ({ storyId, storyCount, version, pdfFile }) => releaseGenerated({ storyId, storyCount, version, pdfFile }),
};

/** Called by notify-adapter with { event, storyId, ...extras }. */
function send({ event, storyId, ...extras }) {
  const fn = EVENT_MAP[event];
  if (!fn) return Promise.resolve({ skipped: true, reason: 'Unknown event: ' + event });
  return fn({ storyId, ...extras });
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
  const fn   = EVENT_MAP[sub];
  if (!fn) {
    console.error('Unknown subcommand: ' + sub);
    console.error('Valid: ' + Object.keys(EVENT_MAP).join(', '));
    process.exit(2);
  }
  fn({ storyId: args.id, file: args.file, count: args.count ? Number(args.count) : undefined, criticalCount: args['critical-count'] ? Number(args['critical-count']) : undefined, storyCount: args['story-count'] ? Number(args['story-count']) : undefined, version: args.version, pdfFile: args['pdf-file'] })
    .then(function(r) { console.log(JSON.stringify(r, null, 2)); })
    .catch(function(e) { console.error(e); process.exit(1); });
}

module.exports = { send, storyCreated, subtasksCreated, devKickoff, reviewPassed, reviewNoGo, devFinished, qaStarted, qaFinished, bugFound, releaseGenerated };

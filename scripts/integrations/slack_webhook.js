/**
 * Slack incoming-webhook integration for Evyasys.
 * Reads webhook from .evyasys/project.yaml (slack.webhook) or SLACK_WEBHOOK env var.
 *
 * CLI:
 *   node slack_webhook.js story-created     --id EVYA-id [--file PATH]
 *   node slack_webhook.js subtasks-created  --id EVYA-id [--count N]
 *   node slack_webhook.js dev-kickoff       --id EVYA-id
 *   node slack_webhook.js review-passed     --id EVYA-id
 *   node slack_webhook.js review-no-go      --id EVYA-id
 *   node slack_webhook.js dev-finished      --id EVYA-id
 *   node slack_webhook.js qa-started        --id EVYA-id
 *   node slack_webhook.js qa-finished       --id EVYA-id
 */
const fs = require('fs');
const { loadConfig } = require('../lib/config');

const snippet = (t, max = 500) => (!t ? '' : t.length > max ? t.slice(0, max) + '…' : t);

function buildMessage(icon, title, text) {
  return {
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `${icon} *${title}*` },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: text },
      },
    ],
  };
}

async function post(message) {
  const cfg = await loadConfig();
  if (cfg.dryRun) {
    console.log('[evyasys:dry-run] Slack message:\n' + JSON.stringify(message, null, 2));
    return { dryRun: true };
  }
  if (!cfg.slack.webhook) {
    throw new Error('No Slack webhook configured. Add slack.webhook to .evyasys/project.yaml or run /evyasys:Setup.');
  }
  const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
  const res = await fetchFn(cfg.slack.webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  if (!res.ok) throw new Error('Slack POST failed: ' + res.status + ' ' + (await res.text()));
  return { ok: true };
}

function storyCreated({ storyId, file }) {
  const preview = file ? snippet(fs.readFileSync(file, 'utf8')) : '';
  return post(buildMessage('📋', `New Story Ready: ${storyId}`, preview || 'Story created and pushed to the board.'));
}

function subtasksCreated({ storyId, count }) {
  const countStr = count ? `${count} task${count !== 1 ? 's' : ''}` : 'tasks';
  return post(buildMessage('🗂️', `Subtasks Ready: ${storyId}`, `${countStr} created — ready for development.`));
}

function devKickoff({ storyId }) {
  return post(buildMessage('🚀', `Dev Started: ${storyId}`, 'In Progress — technical approach agreed.'));
}

function reviewPassed({ storyId }) {
  return post(buildMessage('✅', `Code Review Passed: ${storyId}`, 'Review passed — no Critical issues remaining.'));
}

function reviewNoGo({ storyId }) {
  return post(buildMessage('❌', `Code Review NO-GO: ${storyId}`, 'Fix all Critical findings and run /evyasys:ReviewDev again.'));
}

function devFinished({ storyId }) {
  return post(buildMessage('🔀', `Ready for QA: ${storyId}`, 'Development complete — handed off to QA.'));
}

function qaStarted({ storyId }) {
  return post(buildMessage('🧪', `QA Started: ${storyId}`, 'Test plan committed — QA in progress.'));
}

function qaFinished({ storyId }) {
  return post(buildMessage('🚢', `Released: ${storyId}`, 'Passed QA and marked Done. Release notes committed.'));
}

function bugFound({ storyId, count, criticalCount }) {
  const countStr    = count         ? `${count} bug${count !== 1 ? 's' : ''}`   : 'bugs';
  const criticalStr = criticalCount ? ` (${criticalCount} critical/high)`       : '';
  const status      = criticalCount ? 'Story remains In QA — fix required.'     : 'Story marked Done — bugs logged for tracking.';
  return post(buildMessage('🐛', `Bugs Found: ${storyId}`, `${countStr}${criticalStr} found during QA. ${status}`));
}

function epicsCreated({ epics }) {
  const newCount = epics.filter(e => e.status === 'New').length;
  const exCount  = epics.filter(e => e.status === 'Existing').length;
  const summaryParts = [
    newCount > 0 ? `${newCount} new`      : '',
    exCount  > 0 ? `${exCount} existing`  : '',
  ].filter(Boolean);
  const lines = epics.map(e => {
    const icon  = e.status === 'New' ? '🆕' : '✓';
    const pmStr = e.pmId ? ` | #${e.pmId}` : '';
    return `${icon} *${e.epicId}* — ${e.title}${pmStr}`;
  }).join('\n');
  return post(buildMessage('📂', `Epics: ${summaryParts.join(', ')}`, lines));
}

function storiesBatchCreated({ stories, projectName }) {
  const synced = stories.filter(s => s.status === 'synced').length;
  const failed = stories.filter(s => s.status === 'sync-failed').length;
  const saved  = stories.filter(s => s.status === 'saved').length;
  const statusParts = [
    synced > 0 ? `${synced} synced` : '',
    saved  > 0 ? `${saved} local`   : '',
    failed > 0 ? `${failed} failed` : '',
  ].filter(Boolean);
  const rows = stories.map(s => {
    const icon  = s.status === 'synced' ? '✅' : s.status === 'sync-failed' ? '⚠️' : '💾';
    const pmStr = s.pmId ? `#${s.pmId}` : '—';
    return `${icon} *${s.storyId}* ${s.title} | ${s.epicId || '—'} | ${s.points || '?'}SP | ${pmStr}`;
  }).join('\n');
  const header = projectName ? `*${projectName}*\n` : '';
  return post(buildMessage(
    '📋',
    `${stories.length} Stor${stories.length !== 1 ? 'ies' : 'y'} Created${projectName ? ': ' + projectName : ''}`,
    `${header}${rows}\n_${statusParts.join(' · ')}_`
  ));
}

function subtasksBatchCreated({ stories, sharedTasks, crossStoryFlags, projectName }) {
  const totalTasks  = stories.reduce((n, s) => n + (s.taskCount || 0), 0);
  const synced      = stories.filter(s => s.status === 'synced').length;
  const failed      = stories.filter(s => s.status === 'sync-failed').length;
  const saved       = stories.filter(s => s.status === 'saved').length;
  const statusParts = [
    synced > 0 ? `${synced} synced` : '',
    saved  > 0 ? `${saved} local`   : '',
    failed > 0 ? `${failed} failed` : '',
  ].filter(Boolean);
  const rows = stories.map(s => {
    const icon    = s.status === 'synced' ? '✅' : s.status === 'sync-failed' ? '⚠️' : '💾';
    const pmStr   = s.pmIds && s.pmIds.length > 0 ? s.pmIds.map(id => '#' + id).join(', ') : '—';
    const taskStr = `${s.taskCount || 0} task${(s.taskCount || 0) !== 1 ? 's' : ''}`;
    return `${icon} *${s.storyId}* ${s.title} | ${taskStr} | ${pmStr}`;
  }).join('\n');
  const flagsStr = crossStoryFlags && crossStoryFlags.length > 0
    ? '\n_Cross-story: ' + crossStoryFlags.join('; ') + '_'
    : '';
  const header = projectName ? `*${projectName}*\n` : '';
  return post(buildMessage(
    '📝',
    `${totalTasks} Task${totalTasks !== 1 ? 's' : ''} Across ${stories.length} Stor${stories.length !== 1 ? 'ies' : 'y'}${projectName ? ': ' + projectName : ''}`,
    `${header}${rows}\n_${statusParts.join(' · ')}_${flagsStr}`
  ));
}

function releaseGenerated({ storyId, storyCount, version, pdfFile, executiveSummary, epicGroups, qualityGates, knownIssues }) {
  const vStr  = version    ? ` · v${version}` : '';
  const nStr  = storyCount ? `${storyCount} stor${storyCount !== 1 ? 'ies' : 'y'}` : '';
  const gq    = qualityGates || {};
  const gIcon = (val) => { const u = String(val || '').toUpperCase(); return u === 'PASS' ? '✅' : u === 'FAIL' ? '❌' : '➖'; };
  const gateStr = `Security ${gIcon(gq.security)}  Performance ${gIcon(gq.performance)}  Accessibility ${gIcon(gq.accessibility)}  Data Integrity ${gIcon(gq.dataIntegrity)}`;

  const storyLines = (epicGroups || []).map(eg => {
    const stories = (eg.stories || []).map(s => `   • *${s.id}* ${s.title} — ${s.summary || ''}`).join('\n');
    return `*${eg.epicTitle || eg.epicId}*\n${stories}`;
  }).join('\n\n');

  const issuesLine = (knownIssues || []).length > 0
    ? `\n⚠️ *Known Issues:* ${knownIssues.join(' · ')}`
    : '';

  const pdfLine = pdfFile ? `\n📎 PDF saved → \`${pdfFile}\`` : '';

  const text = [
    nStr && gateStr ? `${nStr}  ·  ${gateStr}` : nStr || gateStr,
    executiveSummary ? `_${executiveSummary}_` : '',
    storyLines,
    issuesLine,
    pdfLine,
  ].filter(Boolean).join('\n');

  return post({
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: `🚀 Release Notes Ready: ${storyId}`, emoji: true } },
      { type: 'section', text: { type: 'mrkdwn', text: text || 'Release notes generated.' } },
      { type: 'divider' },
    ],
  });
}

const EVENT_MAP = {
  'story-created':         ({ storyId, file })                              => storyCreated({ storyId, file }),
  'epics-created':         ({ epics })                                      => epicsCreated({ epics }),
  'stories-batch-created': ({ stories, projectName })                       => storiesBatchCreated({ stories, projectName }),
  'subtasks-created':      ({ storyId, count })                             => subtasksCreated({ storyId, count }),
  'subtasks-batch-created': ({ stories, sharedTasks, crossStoryFlags, projectName }) => subtasksBatchCreated({ stories, sharedTasks, crossStoryFlags, projectName }),
  'dev-kickoff':           ({ storyId })                                    => devKickoff({ storyId }),
  'review-passed':         ({ storyId })                                    => reviewPassed({ storyId }),
  'review-no-go':          ({ storyId })                                    => reviewNoGo({ storyId }),
  'dev-finished':          ({ storyId })                                    => devFinished({ storyId }),
  'qa-started':            ({ storyId })                                    => qaStarted({ storyId }),
  'qa-finished':           ({ storyId })                                    => qaFinished({ storyId }),
  'bug-found':             ({ storyId, count, criticalCount })              => bugFound({ storyId, count, criticalCount }),
  'release-generated':     ({ storyId, storyCount, version, pdfFile, executiveSummary, epicGroups, qualityGates, knownIssues }) => releaseGenerated({ storyId, storyCount, version, pdfFile, executiveSummary, epicGroups, qualityGates, knownIssues }),
};

/** Called by notify-adapter with { event, storyId, ...extras }. */
function send({ event, storyId, ...extras }) {
  const fn = EVENT_MAP[event];
  if (!fn) return Promise.resolve({ skipped: true, reason: `Unknown event: ${event}` });
  return fn({ storyId, ...extras });
}

// CLI
if (require.main === module) {
  function parseArgs(argv) {
    const out = { _: [] };
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      if (a.startsWith('--')) { out[a.slice(2)] = argv[++i]; }
      else { out._.push(a); }
    }
    return out;
  }
  const sub  = process.argv[2];
  const args = parseArgs(process.argv.slice(3));
  const fn   = EVENT_MAP[sub];
  if (!fn) {
    console.error('Unknown subcommand: ' + sub);
    console.error('Valid: ' + Object.keys(EVENT_MAP).join(', '));
    process.exit(2);
  }
  fn({
    storyId:         args.id,
    file:            args.file,
    count:           args.count           ? Number(args.count)           : undefined,
    criticalCount:   args['critical-count'] ? Number(args['critical-count']) : undefined,
    storyCount:      args['story-count']  ? Number(args['story-count'])  : undefined,
    version:         args.version,
    pdfFile:         args['pdf-file'],
    stories:         args.stories         ? JSON.parse(args.stories)         : undefined,
    sharedTasks:     args['shared-tasks'] ? JSON.parse(args['shared-tasks']) : undefined,
    crossStoryFlags: args['cross-flags']  ? JSON.parse(args['cross-flags'])  : undefined,
    projectName:     args['project-name'],
    epics:           args.epics           ? JSON.parse(args.epics)           : undefined,
  })
    .then(r => console.log(JSON.stringify(r, null, 2)))
    .catch(e => { console.error(e); process.exit(1); });
}

module.exports = { send, storyCreated, epicsCreated, storiesBatchCreated, subtasksCreated, subtasksBatchCreated, devKickoff, reviewPassed, reviewNoGo, devFinished, qaStarted, qaFinished, bugFound, releaseGenerated };

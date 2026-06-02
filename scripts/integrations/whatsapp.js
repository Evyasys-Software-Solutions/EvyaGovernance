/**
 * WhatsApp notification integration for Evyasys via Twilio.
 *
 * Reads credentials from loadConfig():
 *   whatsapp.accountSid  (TWILIO_ACCOUNT_SID in credentials)
 *   whatsapp.authToken   (TWILIO_AUTH_TOKEN in credentials)
 *   whatsapp.from        (WHATSAPP_FROM or project.yaml whatsapp.from)
 *   whatsapp.to          (WHATSAPP_TO or project.yaml whatsapp.to)
 *
 * CLI:
 *   node whatsapp.js story-created     --id EVYA-id
 *   node whatsapp.js subtasks-created  --id EVYA-id [--count N]
 *   node whatsapp.js dev-kickoff       --id EVYA-id
 *   node whatsapp.js review-passed     --id EVYA-id
 *   node whatsapp.js review-no-go      --id EVYA-id
 *   node whatsapp.js dev-finished      --id EVYA-id
 *   node whatsapp.js qa-started        --id EVYA-id
 *   node whatsapp.js qa-finished       --id EVYA-id
 */
const { loadConfig } = require('../lib/config');

async function sendMessage(text) {
  const cfg = await loadConfig();
  if (cfg.dryRun) {
    console.log(`[evyasys:dry-run] WhatsApp message: ${text}`);
    return { dryRun: true };
  }
  const { accountSid, authToken, from, to } = cfg.whatsapp;
  if (!accountSid || !authToken || !from || !to) {
    throw new Error('WhatsApp credentials not configured. Run /evyasys:Setup to configure WhatsApp.');
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    From: `whatsapp:${from}`,
    To:   `whatsapp:${to}`,
    Body: text,
  }).toString();

  const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
  const res = await fetchFn(url, {
    method:  'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!res.ok) throw new Error('WhatsApp POST failed: ' + res.status + ' ' + (await res.text()));
  return { ok: true };
}

function storyCreated({ storyId }) {
  return sendMessage(`📋 Evyasys: New Story Ready — ${storyId}. Story created and pushed to the board.`);
}

function subtasksCreated({ storyId, count }) {
  const countStr = count ? `${count} task${count !== 1 ? 's' : ''}` : 'tasks';
  return sendMessage(`🗂️ Evyasys: Subtasks Ready — ${storyId}. ${countStr} created and ready for development.`);
}

function devKickoff({ storyId }) {
  return sendMessage(`🚀 Evyasys: Dev Started — ${storyId}. In Progress, technical approach agreed.`);
}

function reviewPassed({ storyId }) {
  return sendMessage(`✅ Evyasys: Code Review Passed — ${storyId}. No Critical issues remaining.`);
}

function reviewNoGo({ storyId }) {
  return sendMessage(`❌ Evyasys: Code Review NO-GO — ${storyId}. Fix Critical findings and re-run ReviewDev.`);
}

function devFinished({ storyId }) {
  return sendMessage(`🔀 Evyasys: Ready for QA — ${storyId}. Development complete, handed off to QA.`);
}

function qaStarted({ storyId }) {
  return sendMessage(`🧪 Evyasys: QA Started — ${storyId}. Test plan committed, QA in progress.`);
}

function qaFinished({ storyId }) {
  return sendMessage(`🚢 Evyasys: Released — ${storyId}. Passed QA and marked Done.`);
}

function bugFound({ storyId, count, criticalCount }) {
  const countStr    = count         ? `${count} bug${count !== 1 ? 's' : ''}` : 'bugs';
  const criticalStr = criticalCount ? ` (${criticalCount} critical/high)`     : '';
  const status      = criticalCount ? 'Story remains In QA.'                  : 'Story marked Done.';
  return sendMessage(`🐛 Evyasys: Bugs Found — ${storyId}. ${countStr}${criticalStr} found during QA. ${status}`);
}

function epicsCreated({ epics }) {
  const newCount = epics.filter(e => e.status === 'New').length;
  const exCount  = epics.filter(e => e.status === 'Existing').length;
  const summaryParts = [
    newCount > 0 ? `${newCount} new`      : '',
    exCount  > 0 ? `${exCount} existing`  : '',
  ].filter(Boolean);
  const lines = epics.map(e =>
    `${e.status === 'New' ? '🆕' : '✓'} ${e.epicId}: ${e.title}${e.pmId ? ' #' + e.pmId : ''}`
  ).join('\n');
  return sendMessage(`📂 Evyasys: Epics (${summaryParts.join(', ')})\n${lines}`);
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
  const header = [projectName, `${stories.length} stories`].filter(Boolean).join(' — ');
  const lines = stories.map(s => {
    const icon = s.status === 'synced' ? '✅' : s.status === 'sync-failed' ? '⚠️' : '💾';
    return `${icon} ${s.storyId}: ${s.title} [${s.epicId || '—'}] ${s.points || '?'}SP${s.pmId ? ' #' + s.pmId : ''}`;
  }).join('\n');
  const failNote = failed > 0 ? `\n⚠️ ${failed} story/stories saved locally — PM sync pending.` : '';
  return sendMessage(`📋 Evyasys: Stories Created — ${header} (${statusParts.join(' · ')})\n${lines}${failNote}`);
}

function releaseGenerated({ storyId, storyCount, version }) {
  const versionStr = version    ? ` v${version}` : '';
  const countStr   = storyCount ? ` (${storyCount} stor${storyCount !== 1 ? 'ies' : 'y'})` : '';
  return sendMessage(`📄 Evyasys: Release Notes Ready — ${storyId}${versionStr}${countStr}. PDF generated and saved.`);
}

const EVENT_MAP = {
  'story-created':         ({ storyId })                                    => storyCreated({ storyId }),
  'epics-created':         ({ epics })                                      => epicsCreated({ epics }),
  'stories-batch-created': ({ stories, projectName })                       => storiesBatchCreated({ stories, projectName }),
  'subtasks-created':      ({ storyId, count })                             => subtasksCreated({ storyId, count }),
  'dev-kickoff':           ({ storyId })                                    => devKickoff({ storyId }),
  'review-passed':         ({ storyId })                                    => reviewPassed({ storyId }),
  'review-no-go':          ({ storyId })                                    => reviewNoGo({ storyId }),
  'dev-finished':          ({ storyId })                                    => devFinished({ storyId }),
  'qa-started':            ({ storyId })                                    => qaStarted({ storyId }),
  'qa-finished':           ({ storyId })                                    => qaFinished({ storyId }),
  'bug-found':             ({ storyId, count, criticalCount })              => bugFound({ storyId, count, criticalCount }),
  'release-generated':     ({ storyId, storyCount, version })               => releaseGenerated({ storyId, storyCount, version }),
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
  fn({ storyId: args.id, count: args.count ? Number(args.count) : undefined })
    .then(r => console.log(JSON.stringify(r, null, 2)))
    .catch(e => { console.error(e); process.exit(1); });
}

module.exports = { send, storyCreated, epicsCreated, storiesBatchCreated, subtasksCreated, devKickoff, reviewPassed, reviewNoGo, devFinished, qaStarted, qaFinished, bugFound, releaseGenerated };

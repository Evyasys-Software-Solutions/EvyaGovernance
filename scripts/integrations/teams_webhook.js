/**
 * Microsoft Teams Power Automate workflow integration.
 *
 * Posts Adaptive Cards (v1.2) to a Power Automate HTTP trigger webhook.
 * The flow passes the entire body to "Post Adaptive Card to Teams".
 *
 * ── CARD TEMPLATE ────────────────────────────────────────────────────────────
 *
 *  [BADGE]        Small all-caps stage label, coloured text       — always
 *  [TITLE]        Large bold heading, same colour as badge         — always
 *  [SUBTITLE]     Small subtle context line                        — always
 *  ─────────────────────────────────────────────────────
 *  [SUMMARY]      Key / Value FactSet (2–4 pairs)                  — always
 *  ╔══════════════════════════════════════════════════╗
 *  ║  TABLE SECTION (light grey Container)            ║  — batch events only
 *  ║  Section label                                   ║
 *  ║  ID   Detail | Column | Column | Status          ║
 *  ╚══════════════════════════════════════════════════╝
 *
 * ── STAGE COLOUR MAP ─────────────────────────────────────────────────────────
 *  Accent     (blue)   → Planning   : epics, stories, subtasks
 *  Warning    (amber)  → In-flight  : dev started, dev finished, QA started
 *  Good       (green)  → Success    : review passed, QA released, release notes
 *  Attention  (red)    → Blocked    : review NO-GO, critical bugs, sync failures
 *
 * Design rule: text colour is always dark/semantic — never Light — so cards
 * are readable in all Teams themes (light, dark, high contrast).
 *
 * CLI:
 *   node teams_webhook.js <event> [--id <storyId>] [--file <path>] [--count <N>]
 */
const fs = require('fs');
const { loadConfig } = require('../lib/config');

// ── Template primitives ───────────────────────────────────────────────────────

/** Wrap body items into a valid Adaptive Card v1.2 envelope. */
function ac(body) {
  return {
    type:    'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.2',
    body:    body.filter(Boolean),
  };
}

/**
 * Stage badge — small ALL-CAPS label, coloured text.
 * @param {string} text   e.g. 'Planning', 'In Progress', 'Passed', 'Action Required'
 * @param {string} color  'Accent' | 'Warning' | 'Good' | 'Attention'
 */
function badge(text, color) {
  return {
    type: 'TextBlock', text: text.toUpperCase(),
    color, weight: 'Bolder', size: 'Small', spacing: 'None',
  };
}

/**
 * Event title — large bold, same colour as badge.
 * @param {string} text
 * @param {string} color  same as badge
 */
function cardTitle(text, color) {
  return {
    type: 'TextBlock', text,
    color, weight: 'Bolder', size: 'Large', wrap: true, spacing: 'Small',
  };
}

/** Subtitle — small subtle line below the title. */
function cardSubtitle(text) {
  return {
    type: 'TextBlock', text,
    isSubtle: true, size: 'Small', wrap: true, spacing: 'None',
  };
}

/**
 * Summary FactSet — key / value pairs, separated from the header.
 * @param {Array<[string, string]>} pairs  e.g. [['Status', 'In Progress']]
 */
function summaryFacts(pairs) {
  return {
    type: 'FactSet', spacing: 'Medium', separator: true,
    facts: pairs.filter(Boolean).map(([t, v]) => ({ title: t, value: String(v) })),
  };
}

/**
 * Table section — light grey container with a label and a FactSet of rows.
 * Used for batch events (epics list, stories list).
 * @param {string}  label   Section heading e.g. 'Story Details'
 * @param {Array}   rows    [{ title: id, value: detailString }]
 */
function tableSection(label, rows) {
  return {
    type: 'Container', style: 'emphasis', spacing: 'Medium',
    items: [
      { type: 'TextBlock', text: label, weight: 'Bolder', size: 'Small', isSubtle: true, spacing: 'Small' },
      { type: 'FactSet', facts: rows, spacing: 'Small' },
    ],
  };
}

// ── Core POST ─────────────────────────────────────────────────────────────────

async function post(adaptiveCard) {
  const cfg = await loadConfig();
  if (cfg.dryRun) {
    console.log('[evyasys:dry-run] Teams Adaptive Card:\n' + JSON.stringify(adaptiveCard, null, 2));
    return { dryRun: true };
  }
  if (!cfg.teams || !cfg.teams.webhook) {
    throw new Error('No Teams webhook configured. Run /evyasys:Setup to add the Teams workflow URL.');
  }
  const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
  const res = await fetchFn(cfg.teams.webhook, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(adaptiveCard),
  });
  if (!res.ok) {
    throw new Error('Teams POST failed: ' + res.status + ' ' + (await res.text()));
  }
  return { ok: true };
}

// ── Helper ────────────────────────────────────────────────────────────────────

const snippet = (t, max) => {
  if (!t) return null;
  max = max || 500;
  return t.length > max ? t.slice(0, max) + '...' : t;
};

// ── Event handlers ────────────────────────────────────────────────────────────

async function storyCreated({ storyId, file }) {
  const preview = file ? snippet(fs.readFileSync(file, 'utf8')) : null;
  return post(ac([
    badge('Planning', 'Accent'),
    cardTitle('📋 New Story Ready', 'Accent'),
    cardSubtitle(storyId + ' — pushed to board'),
    summaryFacts([
      ['Story',  storyId],
      ['Status', 'Pushed to board — ready for subtask planning'],
    ]),
    preview && tableSection('Story Preview', [
      { title: 'Preview', value: preview },
    ]),
  ]));
}

async function subtasksCreated({ storyId, count }) {
  const n = count ? count + ' task' + (count !== 1 ? 's' : '') : 'tasks';
  return post(ac([
    badge('Planning', 'Accent'),
    cardTitle('🗂️ Subtasks Ready', 'Accent'),
    cardSubtitle(storyId + ' — ' + n + ' created'),
    summaryFacts([
      ['Story',         storyId],
      ['Tasks created', n],
      ['Status',        'Ready for development'],
    ]),
  ]));
}

async function devKickoff({ storyId }) {
  return post(ac([
    badge('In Progress', 'Warning'),
    cardTitle('🚀 Development Started', 'Warning'),
    cardSubtitle(storyId),
    summaryFacts([
      ['Story',     storyId],
      ['Status',    'In Progress'],
      ['Next step', 'Technical approach agreed — development begun'],
    ]),
  ]));
}

async function reviewPassed({ storyId }) {
  return post(ac([
    badge('Passed', 'Good'),
    cardTitle('✅ Code Review Passed', 'Good'),
    cardSubtitle(storyId + ' — no critical issues'),
    summaryFacts([
      ['Story',  storyId],
      ['Result', 'GO — all acceptance criteria met'],
      ['Next',   'Ready for /evyasys:FinishDev'],
    ]),
  ]));
}

async function reviewNoGo({ storyId }) {
  return post(ac([
    badge('Action Required', 'Attention'),
    cardTitle('❌ Code Review NO-GO', 'Attention'),
    cardSubtitle(storyId + ' — critical findings require fixes'),
    summaryFacts([
      ['Story',  storyId],
      ['Result', 'NO-GO'],
      ['Action', 'Fix all Critical findings then re-run /evyasys:ReviewDev'],
    ]),
  ]));
}

async function devFinished({ storyId }) {
  return post(ac([
    badge('In Progress', 'Warning'),
    cardTitle('🔀 Ready for QA', 'Warning'),
    cardSubtitle(storyId + ' — development complete'),
    summaryFacts([
      ['Story',       storyId],
      ['Status',      'Awaiting QA'],
      ['Dev summary', 'Committed to repo'],
    ]),
  ]));
}

async function qaStarted({ storyId }) {
  return post(ac([
    badge('In Progress', 'Warning'),
    cardTitle('🧪 QA Started', 'Warning'),
    cardSubtitle(storyId + ' — test plan ready'),
    summaryFacts([
      ['Story',     storyId],
      ['Status',    'In QA'],
      ['Test plan', 'Committed to repo'],
    ]),
  ]));
}

async function qaFinished({ storyId }) {
  return post(ac([
    badge('Released', 'Good'),
    cardTitle('🚢 Story Released', 'Good'),
    cardSubtitle(storyId + ' — QA passed'),
    summaryFacts([
      ['Story',         storyId],
      ['Status',        'Done'],
      ['Release notes', 'Committed to repo'],
    ]),
  ]));
}

async function bugFound({ storyId, count, criticalCount }) {
  const hasCritical = criticalCount && criticalCount > 0;
  const color       = hasCritical ? 'Attention' : 'Warning';
  const badgeText   = hasCritical ? 'Action Required' : 'QA Finding';
  const n           = count ? count + ' bug' + (count !== 1 ? 's' : '') : 'bugs';
  const critical    = hasCritical ? criticalCount + ' critical/high' : 'none critical';
  const outcome     = hasCritical ? 'Story remains In QA' : 'Story marked Done';
  return post(ac([
    badge(badgeText, color),
    cardTitle('🐛 Bugs Found in QA', color),
    cardSubtitle(storyId + (hasCritical ? ' — action required' : ' — minor issues only')),
    summaryFacts([
      ['Story',         storyId],
      ['Bugs found',    n],
      ['Critical/High', critical],
      ['Status',        outcome],
    ]),
  ]));
}

async function epicsCreated({ epics }) {
  // epics: [{ epicId, title, status, pmId }]
  const newCount = epics.filter(e => e.status === 'New').length;
  const exCount  = epics.filter(e => e.status === 'Existing').length;
  const parts    = [
    newCount > 0 ? newCount + ' new'      : '',
    exCount  > 0 ? exCount  + ' existing' : '',
  ].filter(Boolean);

  const rows = epics.map(e => ({
    title: e.epicId || '-',
    value: (e.title || '-') +
           ' | ' + (e.status === 'New' ? 'New' : 'Existing') +
           (e.pmId ? ' | PM #' + e.pmId : ' | not yet synced'),
  }));

  return post(ac([
    badge('Planning', 'Accent'),
    cardTitle('📂 Epics Ready', 'Accent'),
    cardSubtitle(epics.length + ' epic' + (epics.length !== 1 ? 's' : '') + ' — ' + (parts.join(', ') || 'all existing')),
    summaryFacts([
      ['New epics',      newCount],
      ['Existing epics', exCount],
      ['Total',          epics.length],
    ]),
    tableSection('Epic Details', rows),
  ]));
}

async function storiesBatchCreated({ stories, projectName }) {
  // stories: [{ storyId, title, epicId, points, pmId, status }]
  const synced  = stories.filter(s => s.status === 'synced').length;
  const failed  = stories.filter(s => s.status === 'sync-failed').length;
  const saved   = stories.filter(s => s.status === 'saved').length;
  const skipped = stories.filter(s => s.status === 'skipped').length;
  const count   = stories.length;

  const hasFailures = failed > 0 || skipped > 0;
  const allSynced   = synced === count;
  const color       = hasFailures ? 'Attention' : allSynced ? 'Good' : 'Accent';
  const badgeText   = hasFailures ? 'Action Required' : allSynced ? 'Complete' : 'Planning';

  const proj     = projectName ? projectName + ' — ' : '';
  const subParts = [
    synced  > 0 ? synced  + ' synced'  : '',
    saved   > 0 ? saved   + ' local'   : '',
    failed  > 0 ? failed  + ' failed'  : '',
    skipped > 0 ? skipped + ' skipped' : '',
  ].filter(Boolean);

  const rows = stories.map(s => {
    const statusLabel = s.status === 'synced'      ? 'Synced'
                      : s.status === 'sync-failed'  ? 'PM sync failed'
                      : s.status === 'saved'         ? 'Saved locally'
                      : 'Skipped';
    const pmId = s.pmId ? 'PM #' + s.pmId : statusLabel;
    const sp   = s.points ? s.points + ' SP' : '-';
    return {
      title: s.storyId,
      value: (s.title || '-') + ' | ' + (s.epicId || '-') + ' | ' + sp + ' | ' + pmId,
    };
  });

  const summaryPairs = [
    ['Total', count + ' stories'],
    synced  > 0 ? ['Synced to PM',   synced]                                               : null,
    saved   > 0 ? ['Saved locally',  saved + ' (local-only mode)']                         : null,
    failed  > 0 ? ['PM sync failed', failed + ' — saved locally, will sync when resolved'] : null,
    skipped > 0 ? ['Skipped',        skipped + ' — content block missing']                 : null,
  ];

  return post(ac([
    badge(badgeText, color),
    cardTitle('📋 ' + count + ' Stor' + (count !== 1 ? 'ies' : 'y') + ' Created', color),
    cardSubtitle(proj + subParts.join(', ')),
    summaryFacts(summaryPairs),
    tableSection('Story Details', rows),
  ]));
}

async function subtasksBatchCreated({ stories, sharedTasks, crossStoryFlags, projectName }) {
  const totalTasks = stories.reduce((n, s) => n + (s.taskCount || 0), 0);
  const synced     = stories.filter(s => s.status === 'synced').length;
  const failed     = stories.filter(s => s.status === 'sync-failed').length;
  const saved      = stories.filter(s => s.status === 'saved').length;
  const skipped    = stories.filter(s => s.status === 'skipped').length;
  const count      = stories.length;

  const hasFailures = failed > 0 || skipped > 0;
  const color       = hasFailures ? 'Attention' : 'Accent';
  const badgeText   = hasFailures ? 'Action Required' : 'Planning';

  const proj     = projectName ? projectName + ' — ' : '';
  const subParts = [
    synced  > 0 ? synced  + ' synced'  : '',
    saved   > 0 ? saved   + ' local'   : '',
    failed  > 0 ? failed  + ' failed'  : '',
    skipped > 0 ? skipped + ' skipped' : '',
  ].filter(Boolean);

  const summaryPairs = [
    ['Stories',      count],
    ['Total tasks',  totalTasks],
    synced  > 0 ? ['Synced to PM',   synced  + ' stor' + (synced  !== 1 ? 'ies' : 'y')]  : null,
    saved   > 0 ? ['Saved locally',  saved   + ' stor' + (saved   !== 1 ? 'ies' : 'y')]  : null,
    failed  > 0 ? ['PM sync failed', failed  + ' stor' + (failed  !== 1 ? 'ies' : 'y')]  : null,
    (sharedTasks || []).length > 0
      ? ['Shared tasks', (sharedTasks || []).length + ' task' + ((sharedTasks || []).length !== 1 ? 's' : '') + ' shared across stories']
      : null,
  ];

  const storyRows = stories.map(s => {
    const pmStr     = s.pmIds && s.pmIds.length > 0 ? s.pmIds.map(id => '#' + id).join(', ') : '-';
    const statusLbl = s.status === 'synced'      ? 'Synced'
                    : s.status === 'sync-failed'  ? 'PM sync failed'
                    : s.status === 'saved'         ? 'Saved locally'
                    :                               'Skipped';
    return {
      title: s.storyId,
      value: (s.title || '-') + ' | ' + (s.taskCount || 0) + ' task' + ((s.taskCount || 0) !== 1 ? 's' : '') +
             (s.pmIds && s.pmIds.length > 0 ? ' | ' + pmStr : '') +
             ' | ' + statusLbl,
    };
  });

  const blocks = [
    badge(badgeText, color),
    cardTitle('📝 ' + totalTasks + ' Task' + (totalTasks !== 1 ? 's' : '') + ' Across ' + count + ' Stor' + (count !== 1 ? 'ies' : 'y'), color),
    cardSubtitle(proj + (subParts.join(', ') || 'all saved')),
    summaryFacts(summaryPairs),
    tableSection('Story Breakdown', storyRows),
  ];

  if (crossStoryFlags && crossStoryFlags.length > 0) {
    const flagRows = crossStoryFlags.map((f, i) => ({ title: 'Flag ' + (i + 1), value: f }));
    blocks.push(tableSection('Cross-Story Notes', flagRows));
  }

  return post(ac(blocks));
}

async function releaseGenerated({ storyId, storyCount, version, pdfFile }) {
  const v   = version    ? 'v' + version : '-';
  const n   = storyCount ? storyCount + ' stor' + (storyCount !== 1 ? 'ies' : 'y') : '-';
  const pdf = pdfFile    ? [['PDF', pdfFile]] : [];
  return post(ac([
    badge('Released', 'Good'),
    cardTitle('📄 Release Notes Generated', 'Good'),
    cardSubtitle('Version ' + v),
    summaryFacts([
      ['Story ID', storyId || '-'],
      ['Version',  v],
      ['Stories',  n],
      ...pdf,
    ]),
  ]));
}

// ── Event dispatch ────────────────────────────────────────────────────────────

const EVENT_MAP = {
  'story-created':         ({ storyId, file })                         => storyCreated({ storyId, file }),
  'epics-created':         ({ epics })                                 => epicsCreated({ epics }),
  'stories-batch-created': ({ stories, projectName })                  => storiesBatchCreated({ stories, projectName }),
  'subtasks-created':      ({ storyId, count })                        => subtasksCreated({ storyId, count }),
  'subtasks-batch-created': ({ stories, sharedTasks, crossStoryFlags, projectName }) => subtasksBatchCreated({ stories, sharedTasks, crossStoryFlags, projectName }),
  'dev-kickoff':           ({ storyId })                               => devKickoff({ storyId }),
  'review-passed':         ({ storyId })                               => reviewPassed({ storyId }),
  'review-no-go':          ({ storyId })                               => reviewNoGo({ storyId }),
  'dev-finished':          ({ storyId })                               => devFinished({ storyId }),
  'qa-started':            ({ storyId })                               => qaStarted({ storyId }),
  'qa-finished':           ({ storyId })                               => qaFinished({ storyId }),
  'bug-found':             ({ storyId, count, criticalCount })         => bugFound({ storyId, count, criticalCount }),
  'release-generated':     ({ storyId, storyCount, version, pdfFile }) => releaseGenerated({ storyId, storyCount, version, pdfFile }),
};

/** Called by notify-adapter with { event, storyId, ...extras }. */
function send({ event, storyId, ...extras }) {
  const fn = EVENT_MAP[event];
  if (!fn) return Promise.resolve({ skipped: true, reason: 'Unknown event: ' + event });
  return fn({ storyId, ...extras });
}

// ── CLI entry ─────────────────────────────────────────────────────────────────

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
  fn({
    storyId:         args.id,
    file:            args.file,
    count:           args.count             ? Number(args.count)             : undefined,
    criticalCount:   args['critical-count'] ? Number(args['critical-count']) : undefined,
    storyCount:      args['story-count']    ? Number(args['story-count'])    : undefined,
    version:         args.version,
    pdfFile:         args['pdf-file'],
    stories:         args.stories         ? JSON.parse(args.stories)         : undefined,
    sharedTasks:     args['shared-tasks'] ? JSON.parse(args['shared-tasks']) : undefined,
    crossStoryFlags: args['cross-flags']  ? JSON.parse(args['cross-flags'])  : undefined,
    projectName:     args['project-name'],
  })
    .then(r  => console.log(JSON.stringify(r, null, 2)))
    .catch(e => { console.error(e.message); process.exit(1); });
}

module.exports = {
  send,
  storyCreated, epicsCreated, storiesBatchCreated,
  subtasksCreated, subtasksBatchCreated, devKickoff, reviewPassed, reviewNoGo,
  devFinished, qaStarted, qaFinished, bugFound, releaseGenerated,
};

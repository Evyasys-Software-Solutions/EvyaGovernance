/**
 * Microsoft Teams incoming-webhook integration (Node.js).
 * Reads the channel webhook from .evyasys/project.yaml (per-project) or env.
 * Default mode is LIVE; set EVYASYS_DRY_RUN=1 to preview without HTTP.
 *
 * CLI:
 *   node teams_webhook.js story-created --file <path>          [--id <EVYA-id>]
 *   node teams_webhook.js dev-kickoff   --id <EVYA-id>
 *   node teams_webhook.js dev-finished  --id <EVYA-id>
 *   node teams_webhook.js qa-started    --id <EVYA-id>
 *   node teams_webhook.js qa-finished   --id <EVYA-id>
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
  if (link) card.content.potentialAction = [{ '@type': 'OpenUri', name: 'Open in Azure DevOps', targets: [{ os: 'default', uri: link }] }];
  return card;
}

async function post(card) {
  const cfg = await loadConfig();
  if (cfg.dryRun) {
    console.log(`[evyasys:dry-run] Teams card payload:\n${JSON.stringify(card, null, 2)}`);
    return { dryRun: true };
  }
  if (!cfg.teams.webhook) {
    throw new Error('No Teams webhook configured for this project. Add it to .evyasys/project.yaml under teams.webhook.');
  }
  const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
  const res = await fetchFn(cfg.teams.webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  });
  if (!res.ok) throw new Error(`Teams POST failed: ${res.status} ${await res.text()}`);
  return { ok: true };
}

const snippet = (t, max = 600) => !t ? '' : (t.length > max ? t.slice(0, max) + '…' : t);

async function storyCreated({ storyId, file }) {
  const md = file ? fs.readFileSync(file, 'utf8') : '';
  return post(buildCard({
    title: `New Story Created: ${storyId}`,
    summary: `New Story ${storyId}`,
    sections: [{ title: 'Draft', text: snippet(md) }],
  }));
}
async function devKickoff({ storyId })  { return post(buildCard({ title: `Dev kicked off: ${storyId}`,            summary: `Dev started ${storyId}`,  sections: [{ title: 'Status', text: 'In Progress' }] })); }
async function devFinished({ storyId }) { return post(buildCard({ title: `Dev complete → Ready for QA: ${storyId}`, summary: `Dev complete ${storyId}`, sections: [{ title: 'Status', text: 'Ready for QA' }] })); }
async function qaStarted({ storyId })   { return post(buildCard({ title: `QA started: ${storyId}`,                  summary: `QA started ${storyId}`,   sections: [{ title: 'Status', text: 'In QA' }] })); }
async function qaFinished({ storyId })  { return post(buildCard({ title: `Released: ${storyId}`,                    summary: `Released ${storyId}`,     sections: [{ title: 'Status', text: 'Done' }] })); }

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) out[a.slice(2)] = argv[++i]; else out._.push(a); }
  return out;
}
if (require.main === module) {
  const [sub, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const map = {
    'story-created': () => storyCreated({ storyId: args.id, file: args.file }),
    'dev-kickoff':   () => devKickoff({ storyId: args.id }),
    'dev-finished':  () => devFinished({ storyId: args.id }),
    'qa-started':    () => qaStarted({ storyId: args.id }),
    'qa-finished':   () => qaFinished({ storyId: args.id }),
  };
  if (!map[sub]) { console.error(`Unknown subcommand: ${sub}`); process.exit(2); }
  map[sub]().then((r) => console.log(JSON.stringify(r, null, 2))).catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { storyCreated, devKickoff, devFinished, qaStarted, qaFinished };

/**
 * Notification tool adapter.
 *
 * Routes team notifications to whichever channel the project has configured:
 * none | teams | slack | whatsapp | email
 *
 * Events: story-created | subtasks-created | dev-kickoff | review-passed |
 *         review-no-go | dev-finished | qa-started | qa-finished |
 *         bug-found | release-generated
 */
const {
  ensureTeamsWebhook,
  ensureSlackWebhook,
  ensureWhatsAppCreds,
  ensureEmailCreds,
} = require('./config');

const LABELS = {
  none:      'not needed',
  teams:     'Teams',
  slack:     'Slack',
  whatsapp:  'WhatsApp',
  email:     'Email',
};

/** Human-readable name of the configured notification tool. */
function toolLabel(cfg) {
  return LABELS[cfg.notificationTool] || cfg.notificationTool;
}

/** Ensure notification credentials are present, prompting once if needed. */
async function ensureCredentials(cfg) {
  if (cfg.notificationTool === 'teams')    return ensureTeamsWebhook(cfg);
  if (cfg.notificationTool === 'slack')    return ensureSlackWebhook(cfg);
  if (cfg.notificationTool === 'whatsapp') return ensureWhatsAppCreds(cfg);
  if (cfg.notificationTool === 'email')    return ensureEmailCreds(cfg);
  // none: nothing to do
}

/**
 * Send a notification for the given event.
 * @param {object} cfg — loaded config
 * @param {object} params — { event, storyId, ...extras }
 *   event: 'story-created' | 'subtasks-created' | 'dev-kickoff' | 'review-passed' |
 *          'review-no-go' | 'dev-finished' | 'qa-started' | 'qa-finished' |
 *          'bug-found' | 'release-generated'
 *   extras: event-specific (e.g. file, count, version, pdfFile)
 */
async function send(cfg, { event, storyId, ...extras }) {
  if (cfg.notificationTool === 'none') return { skipped: true };

  const tool = cfg.notificationTool;

  if (tool === 'teams') {
    const tw = require('../integrations/teams_webhook');
    return tw.send({ event, storyId, ...extras });
  }

  if (tool === 'slack') {
    const sw = require('../integrations/slack_webhook');
    return sw.send({ event, storyId, ...extras });
  }

  if (tool === 'whatsapp') {
    const wa = require('../integrations/whatsapp');
    return wa.send({ event, storyId, ...extras });
  }

  if (tool === 'email') {
    const em = require('../integrations/email');
    return em.send(cfg, { event, storyId, ...extras });
  }

  return { skipped: true, reason: `Unknown notification tool: ${tool}` };
}

module.exports = { toolLabel, ensureCredentials, send };

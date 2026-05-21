/**
 * Email notification integration for Evyasys.
 *
 * Sends HTML emails via SMTP (nodemailer).
 * Non-sensitive config (smtp_host, smtp_port, from, to) lives in project.yaml.
 * Sensitive credentials (smtp_user, smtp_password) are encrypted in ~/.evyasys/credentials.
 */
const { ensurePackage } = require('../lib/ensure-package');

function getMailer(cfg, log) {
  const nodemailer = ensurePackage('nodemailer', log);
  return nodemailer.createTransport({
    host:   cfg.email.smtpHost,
    port:   Number(cfg.email.smtpPort) || 587,
    secure: (Number(cfg.email.smtpPort) || 587) === 465,
    auth: {
      user: cfg.email.smtpUser,
      pass: cfg.email.smtpPassword,
    },
  });
}

const EVENT_META = {
  'story-created':    { emoji: '📋', title: 'Story Created'      },
  'subtasks-created': { emoji: '📝', title: 'Subtasks Created'   },
  'dev-kickoff':      { emoji: '🚀', title: 'Dev Started'        },
  'review-passed':    { emoji: '✅', title: 'Code Review Passed' },
  'review-no-go':     { emoji: '🚫', title: 'Code Review NO-GO'  },
  'dev-finished':     { emoji: '🏁', title: 'Dev Finished'       },
  'qa-started':       { emoji: '🔍', title: 'QA Started'         },
  'qa-finished':      { emoji: '🎉', title: 'QA Finished'        },
  'bug-found':          { emoji: '🐛', title: 'Bugs Found in QA'        },
  'release-generated':  { emoji: '📄', title: 'Release Notes Generated' },
};

function buildHtml(event, storyId, extras) {
  const meta    = EVENT_META[event] || { emoji: '📌', title: event };
  const details = Object.entries(extras)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `<tr><td style="padding:4px 8px;color:#666">${k}</td><td style="padding:4px 8px">${v}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;margin:0;padding:20px;background:#f5f5f5">
  <div style="max-width:520px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.12)">
    <div style="background:#0078d4;padding:16px 20px">
      <span style="font-size:22px">${meta.emoji}</span>
      <span style="color:#fff;font-size:18px;font-weight:600;margin-left:8px">${meta.title}</span>
    </div>
    <div style="padding:20px">
      <p style="margin:0 0 12px;font-size:15px">Story: <strong>${storyId}</strong></p>
      ${details ? `<table style="border-collapse:collapse;width:100%">${details}</table>` : ''}
      <hr style="margin:16px 0;border:none;border-top:1px solid #eee">
      <p style="margin:0;font-size:12px;color:#999">Sent by Evyasys · <a href="https://github.com/Evyasys-Software-Solutions/EvyaGovernance" style="color:#0078d4;text-decoration:none">EvyaGovernance</a></p>
    </div>
  </div>
</body>
</html>`;
}

async function send(cfg, { event, storyId, ...extras }, log) {
  const meta      = EVENT_META[event] || { emoji: '📌', title: event };
  const subject   = `[Evyasys] ${meta.emoji} ${meta.title}: ${storyId}`;
  const html      = buildHtml(event, storyId, extras);
  const transporter = getMailer(cfg, log);

  return transporter.sendMail({
    from:    cfg.email.from    || cfg.email.smtpUser,
    to:      cfg.email.to,
    subject,
    html,
  });
}

module.exports = { send };

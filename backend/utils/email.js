const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// EMAIL_FROM must be an address on a domain you've verified in Resend
// (Domains → Add Domain → add the DNS records → Verify). Until that's done,
// Resend can only deliver to your own account email via onboarding@resend.dev.
const FROM = process.env.EMAIL_FROM || 'noreply@example.com';

async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping email to ${to}: "${subject}"`);
    return { skipped: true };
  }
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) throw new Error(error.message || 'Resend send failed');
    return data;
  } catch (e) {
    console.error('[email] send failed:', e.message);
    throw new Error(e.message);
  }
}

function wrapper(title, bodyHtml) {
  return `
  <div style="background:#060d1a;padding:40px 20px;font-family:Georgia,serif;">
    <div style="max-width:480px;margin:0 auto;background:#0d1b30;border:1px solid rgba(201,164,78,0.25);border-radius:12px;padding:36px 32px;">
      <div style="font-size:20px;font-weight:700;color:#c9a44e;margin-bottom:24px;">The Scribe</div>
      <h1 style="font-size:20px;color:#f5ecd8;margin:0 0 16px;">${title}</h1>
      ${bodyHtml}
      <p style="font-size:12px;color:#8a93a6;margin-top:32px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>`;
}

function buttonHtml(href, label) {
  return `<a href="${href}" style="display:inline-block;background:#c9a44e;color:#060d1a;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:8px;font-family:Arial,sans-serif;font-size:14px;margin:8px 0 4px;">${label}</a>`;
}

async function sendVerificationEmail(to, name, link) {
  const html = wrapper('Verify your email', `
    <p style="font-size:14px;color:#cdd3de;line-height:1.6;font-family:Arial,sans-serif;">Hi ${name || 'there'}, welcome to The Scribe. Please confirm your email address to finish setting up your account.</p>
    ${buttonHtml(link, 'Verify Email →')}
    <p style="font-size:12px;color:#8a93a6;font-family:Arial,sans-serif;">Or paste this link into your browser: <br/>${link}</p>
  `);
  return sendEmail({ to, subject: 'Verify your email — The Scribe', html });
}

async function sendPasswordResetEmail(to, name, link) {
  const html = wrapper('Reset your password', `
    <p style="font-size:14px;color:#cdd3de;line-height:1.6;font-family:Arial,sans-serif;">Hi ${name || 'there'}, we received a request to reset your password. This link expires in 1 hour.</p>
    ${buttonHtml(link, 'Reset Password →')}
    <p style="font-size:12px;color:#8a93a6;font-family:Arial,sans-serif;">Or paste this link into your browser: <br/>${link}</p>
  `);
  return sendEmail({ to, subject: 'Reset your password — The Scribe', html });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };

import nodemailer from 'nodemailer';
import { config } from '../config.js';

const transporter =
  config.smtp.host && config.smtp.user
    ? nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: config.smtp.pass ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
      })
    : null;

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const resetUrl = `${config.clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const html = `
    <p>Hi ${name},</p>
    <p>You requested a password reset for your FSCM account.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject: 'FSCM – Password Reset',
      html,
    });
  } else {
    console.log('[DEV] Password reset link (no SMTP):', resetUrl);
  }
}

export async function sendCancellationEmail(
  to: string,
  name: string,
  facilityName: string,
  startTime: Date,
  refundAmount: number,
  refundTier: string
): Promise<void> {
  const dateStr = startTime.toLocaleString();
  const html = `
    <p>Hi ${name},</p>
    <p>Your booking for <strong>${facilityName}</strong> on ${dateStr} has been cancelled.</p>
    <p>Refund: ${refundTier === 'full' ? 'Full' : refundTier === 'half' ? '50%' : 'None'} (${refundAmount > 0 ? `PKR ${refundAmount}` : 'No refund'}).</p>
    <p>If a refund applies, it will be processed per our policy.</p>
  `;
  if (transporter) {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject: 'FSCM – Booking Cancelled',
      html,
    });
  } else {
    console.log('[DEV] Cancellation email (no SMTP):', to, facilityName, refundAmount);
  }
}

export async function sendAdminReportEmail(subject: string, html: string): Promise<void> {
  const recipients = config.reports.recipients;
  if (recipients.length === 0) {
    console.log('[DEV] Admin report (no ADMIN_REPORT_EMAILS):', subject);
    console.log(html.replace(/<[^>]+>/g, ' ').slice(0, 4000));
    return;
  }

  if (transporter) {
    await transporter.sendMail({
      from: config.smtp.from,
      to: recipients.join(','),
      subject,
      html,
    });
    return;
  }

  console.log('[DEV] Admin report (no SMTP):', recipients.join(','), subject);
  console.log(html.replace(/<[^>]+>/g, ' ').slice(0, 4000));
}

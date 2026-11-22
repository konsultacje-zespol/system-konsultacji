import nodemailer from 'nodemailer';
import { config } from '../config.js';

// One transport for the whole app. Locally it sends to Mailpit (http://localhost:8025).
const transport = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: false,
});

// icalEvent (optional) = { method: 'REQUEST' | 'CANCEL' | 'PUBLISH', content } — the calendar invitation (sprint 2).
// Errors are NOT caught here: the outbox worker decides whether to try again.
export async function sendMail({ to, subject, text, icalEvent }) {
  const message = {
    from: config.MAIL_FROM,
    to,
    subject,
    text,
  };

  if (icalEvent) {
    message.icalEvent = icalEvent;
  }

  await transport.sendMail(message);
}

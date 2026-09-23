import { createTransport } from 'nodemailer';

export const mailFrom = process.env.EMAIL_FROM || 'Chordy <chordy@localhost>';

let transport = null;

function smtp() {
  const port = Number(process.env.EMAIL_SERVER_PORT) || 587;
  const user = process.env.EMAIL_SERVER_USER;

  transport ??= createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port,
    // Port 465 speaks TLS from the first byte; 587 and 25 start plain and upgrade via STARTTLS.
    secure: port === 465,
    // Omitted entirely for relays that authenticate by IP — an empty user makes nodemailer
    // send AUTH with blank credentials and the server rejects the whole message.
    auth: user ? { user, pass: process.env.EMAIL_SERVER_PASSWORD } : undefined,
  });

  return transport;
}

/**
 * Same shape as the transport this config was ported from, so the auth setup does not care
 * which service is behind it. Without an SMTP host the message is written to the terminal,
 * which is enough to sign in during development.
 */
export async function mailSend({ from, to, subject, html, text }) {
  if (!process.env.EMAIL_SERVER_HOST) {
    console.info(`\n──── email to ${to} ────\n${subject}\n\n${text}\n────────────────────────\n`);
    return;
  }

  await smtp().sendMail({ from, to, subject, html, text });
}

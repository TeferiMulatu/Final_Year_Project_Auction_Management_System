import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const EMAIL_USER = process.env.EMAIL_USER || 'mauauction3@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || '';

let transporter = null;

async function initTransporter() {
  if (transporter) return transporter;
  try {
    if (!EMAIL_PASS) {
      console.warn('Mailer: EMAIL_PASS not set — using Ethereal test account for development. Set EMAIL_PASS for real Gmail delivery.');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      console.log('Mailer: using Ethereal account', testAccount.user);
    } else {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: EMAIL_USER, pass: EMAIL_PASS }
      });
      try {
        await transporter.verify();
        console.log('Mailer: Gmail transporter verified');
      } catch (vErr) {
        console.error('Mailer: transporter verification failed:', vErr && vErr.stack ? vErr.stack : vErr);
        // If Gmail auth fails, fall back to Ethereal for testing so emails can still be previewed
        try {
          const testAccount = await nodemailer.createTestAccount();
          transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass }
          });
          console.warn('Mailer: fell back to Ethereal test account due to Gmail auth failure');
          console.log('Mailer: using Ethereal account', testAccount.user);
        } catch (ethErr) {
          console.error('Mailer: failed to create Ethereal account fallback:', ethErr && ethErr.stack ? ethErr.stack : ethErr);
        }
      }
    }
  } catch (err) {
    console.error('Mailer init error:', err && err.stack ? err.stack : err);
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  const t = await initTransporter();
  if (!t) throw new Error('No mail transporter available');
  const mailOptions = { from: EMAIL_USER, to, subject, text, html };
  try {
    const info = await t.sendMail(mailOptions);
    console.log('Mailer: email sent', info.messageId || info);
    // If using ethereal, provide preview URL
    if (nodemailer.getTestMessageUrl) {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) console.log('Mailer: test message preview URL:', url);
    }
    return info;
  } catch (err) {
    console.error('Mailer send error:', err && err.stack ? err.stack : err);
    throw err;
  }
}

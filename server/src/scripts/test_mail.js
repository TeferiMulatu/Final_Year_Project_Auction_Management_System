import { sendMail } from '../utils/mailer.js';

async function run() {
  try {
    const to = process.argv[2] || 'bidder@gmail.com';
    const subject = 'Test: Congratulations from MAU Auction';
    const text = 'This is a test congrats email from the MAU Auction system.';
    const info = await sendMail({ to, subject, text });
    console.log('Test mail sent result:', info);
  } catch (err) {
    console.error('Test mail failed:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

run();

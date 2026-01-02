import pool from '../config/db.js';

async function run() {
  const userId = Number(process.argv[2] || 4);
  const amount = Number(process.argv[3] || 20000);
  try {
    await pool.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, userId]);
    await pool.query('INSERT INTO transactions (user_id, type, amount, note) VALUES (?, ?, ?, ?)', [userId, 'TOPUP', amount, 'Test top-up']);
    console.log(`Credited ${amount} to user ${userId}`);
    process.exit(0);
  } catch (e) {
    console.error('Failed to credit balance', e && e.stack ? e.stack : e);
    process.exit(1);
  }
}

run();

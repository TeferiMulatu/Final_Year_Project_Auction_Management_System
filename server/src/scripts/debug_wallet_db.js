import pool from '../config/db.js';

async function run() {
  try {
    const userId = 3;
    const [rows] = await pool.query('SELECT id, name, email, balance FROM users WHERE id = ?', [userId]);
    console.log('User query result rows:', rows);
    const user = rows && rows[0];
    if (!user) { console.log('User not found'); process.exit(1); }
    const [transactions] = await pool.query('SELECT id, type, amount, related_user_id, auction_id, note, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100', [userId]);
    console.log('Transactions:', transactions);
  } catch (e) {
    console.error('DB test error', e && e.stack ? e.stack : e);
  } finally {
    process.exit();
  }
}
run();

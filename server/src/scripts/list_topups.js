import pool from '../config/db.js';

async function run() {
  try {
    const userId = 3; // seeded bidder
    const [rows] = await pool.query('SELECT id, user_id, amount, status, note, created_at, processed_at FROM wallet_topups WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    console.log('Topups for user', userId, rows);
  } catch (e) {
    console.error('List topups error', e && e.stack ? e.stack : e);
  } finally {
    process.exit();
  }
}

run();

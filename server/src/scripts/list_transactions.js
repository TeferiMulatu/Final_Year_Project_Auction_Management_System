import pool from '../config/db.js';

async function run() {
  const userId = Number(process.argv[2] || 4);
  try {
    const [rows] = await pool.query('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    if (!rows.length) console.log('No transactions for user', userId);
    else {
      console.log('Transactions for user', userId);
      for (const r of rows) console.log(r);
    }
    process.exit(0);
  } catch (e) {
    console.error('Failed to list transactions', e && e.stack ? e.stack : e);
    process.exit(1);
  }
}

run();

import pool from '../config/db.js';

async function run() {
  const userId = process.argv[2] || 4;
  try {
    const [auctions] = await pool.query('SELECT id, title, status, winner_id, final_price, ends_at FROM auctions WHERE winner_id = ? ORDER BY ends_at DESC', [userId]);
    console.log(`Auctions won by user ${userId}:`);
    if (!auctions.length) console.log('  (none)');
    for (const a of auctions) console.log(`  ${a.id}\t${a.title}\tstatus=${a.status}\tfinal=${a.final_price}\tends=${a.ends_at}`);

    const [notifs] = await pool.query('SELECT id, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    console.log(`Notifications for user ${userId}:`);
    if (!notifs.length) console.log('  (none)');
    for (const n of notifs) console.log(`  ${n.id}\tread=${n.is_read}\t${n.created_at}\t${n.message}`);

    // Show user email
    const [users] = await pool.query('SELECT id, name, email, is_active FROM users WHERE id = ?', [userId]);
    if (users.length) console.log('User:', users[0]);

    process.exit(0);
  } catch (err) {
    console.error('Error', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

run();

import pool from '../config/db.js';

async function run() {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, is_active, created_at FROM users ORDER BY id ASC');
    console.log('Registered users:');
    for (const r of rows) {
      console.log(`${r.id}\t${r.name}\t${r.email}\t${r.role}\tactive=${r.is_active}\tcreated=${r.created_at}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Failed to list users:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

run();

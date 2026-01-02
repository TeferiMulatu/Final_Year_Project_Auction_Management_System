import pool from '../config/db.js';

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [cols] = await conn.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'auctions' AND COLUMN_NAME = 'is_paid'");
    if (!cols.length) {
      await conn.query('ALTER TABLE auctions ADD COLUMN is_paid TINYINT(1) NOT NULL DEFAULT 0');
    }
    await conn.commit();
    console.log('Migration applied: auctions.is_paid added (if missing).');
  } catch (e) {
    await conn.rollback();
    console.error('Migration failed', e && e.stack ? e.stack : e);
    process.exitCode = 1;
  } finally {
    conn.release();
    process.exit();
  }
}

run();

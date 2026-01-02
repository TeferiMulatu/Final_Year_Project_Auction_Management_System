import pool from '../config/db.js';

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Create wallet_topups table to store top-up requests
    await conn.query(`
      CREATE TABLE IF NOT EXISTS wallet_topups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        admin_id INT DEFAULT NULL,
        note VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL DEFAULT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB;
    `);

    await conn.commit();
    console.log('Migration applied: wallet_topups table created.');
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

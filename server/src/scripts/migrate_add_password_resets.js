import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(128) NOT NULL,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX(token_hash)
      ) ENGINE=InnoDB;
    `);
    await conn.commit();
    console.log('Migration: password_resets table created or already exists');
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

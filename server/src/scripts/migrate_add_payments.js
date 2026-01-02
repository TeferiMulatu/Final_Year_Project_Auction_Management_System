import pool from '../config/db.js';

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Add balance column to users if missing
    const [cols] = await conn.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'balance'");
    if (!cols.length) {
      await conn.query("ALTER TABLE users ADD COLUMN balance DECIMAL(12,2) NOT NULL DEFAULT 0.00");
    }

    // Create transactions table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        related_user_id INT DEFAULT NULL,
        auction_id INT DEFAULT NULL,
        note VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB;
    `);

    // Do not seed non-zero balances here. New users should start with 0 balance.
    // If you need sample balances for manual testing, use the `credit_balance.js` script instead.

    // Add is_paid flag to auctions if missing
    const [aCols] = await conn.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'auctions' AND COLUMN_NAME = 'is_paid'");
    if (!aCols.length) {
      await conn.query("ALTER TABLE auctions ADD COLUMN is_paid TINYINT(1) NOT NULL DEFAULT 0");
    }

    await conn.commit();
    console.log('Migration applied: users.balance + transactions table created, sample balances seeded.');
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

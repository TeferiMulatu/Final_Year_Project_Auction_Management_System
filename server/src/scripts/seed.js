import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

dotenv.config();

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Create tables
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(120) NOT NULL UNIQUE,
        password_hash VARCHAR(200) NOT NULL,
        role ENUM('ADMIN','SELLER','BIDDER') NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS auctions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller_id INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(80) NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        start_price DECIMAL(10,2) NOT NULL,
        current_price DECIMAL(10,2) NOT NULL,
        ends_at DATETIME NOT NULL,
        status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES users(id)
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS bids (
        id INT AUTO_INCREMENT PRIMARY KEY,
        auction_id INT NOT NULL,
        bidder_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (auction_id) REFERENCES auctions(id),
        FOREIGN KEY (bidder_id) REFERENCES users(id)
      ) ENGINE=InnoDB;
    `);

    // Seed users
    const adminPass = await bcrypt.hash('Admin@123', 10);
    const sellerPass = await bcrypt.hash('Seller@123', 10);
    const bidderPass = await bcrypt.hash('Bidder@123', 10);

    await conn.query(
      'INSERT IGNORE INTO users (id, name, email, password_hash, role, is_active) VALUES (1, "Admin", "admin@mau.edu.et", ?, "ADMIN", 1), (2, "Seller One", "seller@mau.edu.et", ?, "SELLER", 1), (3, "Bidder One", "bidder@mau.edu.et", ?, "BIDDER", 1)',
      [adminPass, sellerPass, bidderPass]
    );

    // Seed auctions
    const now = new Date();
    const ends = new Date(now.getTime() + 1000 * 60 * 60 * 24);
    await conn.query(
      'INSERT IGNORE INTO auctions (id, seller_id, title, description, category, image_url, start_price, current_price, ends_at, status) VALUES (1, 2, "Dell Latitude 7420", "Business laptop in great condition", "Electronics", "https://picsum.photos/seed/laptop/600/400", 300.00, 300.00, ?, "APPROVED"), (2, 2, "Office Chair", "Ergonomic chair with lumbar support", "Furniture", "https://picsum.photos/seed/chair/600/400", 50.00, 50.00, ?, "APPROVED")',
      [ends, ends]
    );

    // Seed bids
    await conn.query(
      'INSERT IGNORE INTO bids (id, auction_id, bidder_id, amount) VALUES (1, 1, 3, 320.00), (2, 1, 3, 350.00)'
    );

    await conn.commit();
    // eslint-disable-next-line no-console
    console.log('Database seeded.');
  } catch (e) {
    await conn.rollback();
    // eslint-disable-next-line no-console
    console.error('Seed failed', e.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    process.exit();
  }
}

run();



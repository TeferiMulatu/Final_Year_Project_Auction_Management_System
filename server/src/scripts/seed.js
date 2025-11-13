import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

dotenv.config();

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Drop existing tables to ensure a fresh start
    // Disable foreign key checks to allow dropping in any order
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('DROP TABLE IF EXISTS bids');
    await conn.query('DROP TABLE IF EXISTS auctions');
    await conn.query('DROP TABLE IF EXISTS users');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create tables
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(120) NOT NULL UNIQUE,
        password_hash VARCHAR(200) NOT NULL,
        role ENUM('ADMIN','SELLER','BIDDER') NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        fin_number VARCHAR(120) DEFAULT NULL,
        id_front_url VARCHAR(255) DEFAULT NULL,
        id_back_url VARCHAR(255) DEFAULT NULL,
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
        min_increment DECIMAL(10,2) NOT NULL DEFAULT 1.00,
        max_increment DECIMAL(10,2) DEFAULT NULL,
        winner_id INT DEFAULT NULL,
        final_price DECIMAL(10,2) DEFAULT NULL,
        ends_at DATETIME NOT NULL,
        status ENUM('PENDING','APPROVED','REJECTED','CLOSED') NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES users(id),
        FOREIGN KEY (winner_id) REFERENCES users(id)
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
    const adminPass = await bcrypt.hash('admin@123', 10);
    const sellerPass = await bcrypt.hash('seller@123', 10);
    const bidderPass = await bcrypt.hash('bidder@123', 10);

    await conn.query(
      'INSERT IGNORE INTO users (id, name, email, password_hash, role, is_active, fin_number, id_front_url, id_back_url) VALUES (1, "Admin", "admin@gmail.com", ?, "ADMIN", 1, "ADMINFIN000", NULL, NULL), (2, "Seller One", "seller@gmail.com", ?, "SELLER", 1, "SELLERFIN123", "https://picsum.photos/seed/idfrontseller/400/250", "https://picsum.photos/seed/idbackseller/400/250"), (3, "Bidder One", "bidder@gmail.com", ?, "BIDDER", 1, "BIDDERFIN456", "https://picsum.photos/seed/idfrontbidder/400/250", "https://picsum.photos/seed/idbackbidder/400/250")',
      [adminPass, sellerPass, bidderPass]
    );

    // Seed auctions
    const now = new Date();
    const ends = new Date(now.getTime() + 1000 * 60 * 60 * 24);
    await conn.query(
      'INSERT IGNORE INTO auctions (id, seller_id, title, description, category, image_url, start_price, current_price, min_increment, max_increment, ends_at, status) VALUES (1, 2, "Dell Latitude 7420", "Business laptop in great condition", "Electronics", "https://images.pexels.com/photos/1092652/pexels-photo-1092652.jpeg", 300.00, 300.00, 500.00, 1000.00, ?, "APPROVED"), (2, 2, "Office Chair", "Ergonomic chair with lumbar support", "Furniture", "https://images.pexels.com/photos/1957477/pexels-photo-1957477.jpeg", 5000.00, 5000.00, 500.00, 1000.00, ?, "APPROVED")',
      [ends, ends]
    );

    // Seed bids
    await conn.query(
      'INSERT IGNORE INTO bids (id, auction_id, bidder_id, amount) VALUES (1, 1, 3, 320.00), (2, 1, 3, 35000.00)'
    );

    // Ensure auctions.current_price matches highest bid if any
    await conn.query(`
      UPDATE auctions a
      JOIN (
        SELECT auction_id, MAX(amount) AS maxbid FROM bids GROUP BY auction_id
      ) b ON a.id = b.auction_id
      SET a.current_price = b.maxbid, a.final_price = b.maxbid
      WHERE b.maxbid > a.current_price
    `);

    // Notifications table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message VARCHAR(255) NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB;
    `);

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



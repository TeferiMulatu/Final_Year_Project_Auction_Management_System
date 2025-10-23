import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Make sure this is here to load .env variables

console.log('DB_PASSWORD:', process.env.DB_PASSWORD); 
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'maun_auction',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;



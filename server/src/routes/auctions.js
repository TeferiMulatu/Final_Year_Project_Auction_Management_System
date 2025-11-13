import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

// Configure multer to store uploads in server/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, unique);
  }
});
const upload = multer({ storage });

const router = Router();

// Public: list approved auctions with optional search
router.get('/', async (req, res) => {
  const { q } = req.query;
  try {
    const like = `%${q || ''}%`;
    const [rows] = await pool.query(
      `SELECT a.id, a.title, a.description, a.category, a.image_url, a.start_price,
              a.current_price, a.min_increment, a.max_increment, a.winner_id, a.final_price, a.ends_at, a.status, u.name AS seller_name
         FROM auctions a
         JOIN users u ON u.id = a.seller_id
        WHERE a.status = 'APPROVED' AND (a.title LIKE ? OR a.category LIKE ?)
        ORDER BY a.ends_at ASC`,
      [like, like]
    );
    res.json(rows);
  } catch (e) {
    // Log full error for debugging
    console.error('List auctions error:', e && e.stack ? e.stack : e);
    // Return message with error in development for faster debugging
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({ message: 'Failed to list auctions', error: isDev ? e.message : undefined });
  }
});

// Seller: get my auctions (place before parameterized routes to avoid shadowing)
router.get('/my-auctions', authenticate, authorize(['SELLER']), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM auctions WHERE seller_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch auctions' });
  }
});

// Public: auction detail
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM auctions WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    const [bids] = await pool.query(
      `SELECT b.id, b.amount, b.created_at, b.bidder_id, u.name AS bidder_name 
         FROM bids b 
         JOIN users u ON u.id=b.bidder_id 
        WHERE b.auction_id = ? 
        ORDER BY b.created_at DESC`,
      [req.params.id]
    );
    res.json({ auction: rows[0], bids });
  } catch (e) {
    console.error('Load auction error:', e && e.stack ? e.stack : e);
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({ message: 'Failed to load auction', error: isDev ? e.message : undefined });
  }
});

// Close auction and determine winner
router.post('/:id/close', authenticate, async (req, res) => {
  const auctionId = req.params.id;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM auctions WHERE id = ? FOR UPDATE', [auctionId]);
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Auction not found' });
    }
    const auction = rows[0];

    // Only allow close if auction is approved or pending; ignore if already closed
    if (auction.status === 'CLOSED') {
      await conn.rollback();
      return res.status(400).json({ message: 'Auction already closed' });
    }

    // Find highest bid
    const [best] = await conn.query('SELECT bidder_id, amount FROM bids WHERE auction_id = ? ORDER BY amount DESC, created_at ASC LIMIT 1', [auctionId]);
    let winnerId = null;
    let finalPrice = null;
    if (best.length) {
      winnerId = best[0].bidder_id;
      finalPrice = best[0].amount;
    }

    await conn.query('UPDATE auctions SET status = ?, winner_id = ?, final_price = ? WHERE id = ?', ['CLOSED', winnerId, finalPrice, auctionId]);

    // Insert notification for winner
    if (winnerId) {
      const message = `Congratulations, you won auction ${auction.title} with a bid of ${finalPrice} Br!`;
      await conn.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [winnerId, message]);
      // Emit socket events: to auction room and to user room
      const io = req.app.get('io');
      if (io) {
        io.to(`auction_${auctionId}`).emit('auction_closed', { auctionId: Number(auctionId), winnerId, finalPrice });
        io.to(`user_${winnerId}`).emit('notification', { message, auctionId: Number(auctionId) });
      }
    } else {
      const io = req.app.get('io');
      if (io) io.to(`auction_${auctionId}`).emit('auction_closed', { auctionId: Number(auctionId), winnerId: null, finalPrice: null });
    }

    await conn.commit();
    res.json({ auctionId: Number(auctionId), winnerId, finalPrice });
  } catch (e) {
    await conn.rollback();
    console.error('Close auction error:', e && e.stack ? e.stack : e);
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({ message: 'Failed to close auction', error: isDev ? e.message : undefined });
  } finally {
    conn.release();
  }
});

// Seller: create auction (pending approval)
// Accepts either a JSON body with image_url, or multipart/form-data with a file field named 'image'
router.post(
  '/',
  authenticate,
  authorize(['SELLER']),
  upload.single('image'),
  async (req, res) => {
  // Validate required fields server-side (simple checks)
  const { title, description, category, image_url, start_price, ends_at, min_increment, max_increment } = req.body;
    if (!title || title.length < 3) return res.status(400).json({ message: 'Title must be at least 3 characters' });
    if (!description || description.length < 10) return res.status(400).json({ message: 'Description must be at least 10 characters' });
    if (!category) return res.status(400).json({ message: 'Category is required' });
  if (!start_price || Number(start_price) <= 0) return res.status(400).json({ message: 'Starting price must be greater than 0' });
    if (!ends_at || Number(new Date(ends_at)) === NaN) return res.status(400).json({ message: 'End date must be a valid date' });

    // Determine image URL: if file uploaded, build absolute URL; otherwise use provided image_url
    let finalImageUrl = image_url || '';
    if (req.file) {
      const host = `${req.protocol}://${req.get('host')}`;
      finalImageUrl = `${host}/uploads/${req.file.filename}`;
    }

    try {
      const mi = min_increment ? Number(min_increment) : 1.00;
      const ma = max_increment ? Number(max_increment) : null;
      // Server-side validation for sensible increment values
      if (Number.isNaN(mi) || mi <= 0) {
        return res.status(400).json({ message: 'min_increment must be a number greater than 0' });
      }
      if (ma !== null && (Number.isNaN(ma) || ma < 0)) {
        return res.status(400).json({ message: 'max_increment must be a non-negative number' });
      }
      if (ma !== null && ma < mi) {
        return res.status(400).json({ message: 'max_increment must be greater than or equal to min_increment' });
      }
      const [result] = await pool.query(
        `INSERT INTO auctions (seller_id, title, description, category, image_url, start_price, current_price, min_increment, max_increment, ends_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
        [req.user.id, title, description, category, finalImageUrl, start_price, start_price, mi, ma, ends_at]
      );
      res.status(201).json({ id: result.insertId });
    } catch (e) {
      console.error('Create auction error', e);
      res.status(500).json({ message: 'Failed to create auction' });
    }
  }
);

export default router;



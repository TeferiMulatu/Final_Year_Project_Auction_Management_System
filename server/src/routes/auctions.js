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
              a.current_price, a.min_increment, a.max_increment, a.deposit_amount, a.reserve_price, a.buy_now_price, a.winner_id, a.final_price, a.ends_at, a.status, u.name AS seller_name
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
        `SELECT b.id, b.amount, b.created_at, b.bidder_id, b.deposit_paid, b.deposit_refunded, b.refund_amount, u.name AS bidder_name 
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

    // Reserve enforcement: if reserve_price set and highest bid < reserve, auction is not sold
    const reserve = auction.reserve_price ? Number(auction.reserve_price) : null;
    if (reserve !== null && (finalPrice === null || Number(finalPrice) < reserve)) {
      // No winner
      winnerId = null;
      finalPrice = null;
    }

    await conn.query('UPDATE auctions SET status = ?, winner_id = ?, final_price = ? WHERE id = ?', ['CLOSED', winnerId, finalPrice, auctionId]);

    // Refund logic: refund deposits to non-winning bidders and notify users
    // Sum deposits per bidder for this auction
    const [bidderSums] = await conn.query(
      'SELECT bidder_id, SUM(deposit_paid) AS total_deposit FROM bids WHERE auction_id = ? GROUP BY bidder_id',
      [auctionId]
    );
    const io = req.app.get('io');
    for (const b of bidderSums) {
      const bidderId = b.bidder_id;
      const total = Number(b.total_deposit || 0);
      if (total <= 0) continue; // nothing to refund or hold

      if (winnerId && Number(bidderId) === Number(winnerId)) {
        // Winner: deposit is held toward settlement; notify winner
        const msg = `Your deposit of ${total.toFixed(2)} Br for auction ${auction.title} is being held pending payment.`;
        await conn.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [bidderId, msg]);
        if (io) io.to(`user_${bidderId}`).emit('notification', { message: msg, auctionId: Number(auctionId) });
        continue;
      }

      // Non-winner: mark deposit_refunded on their bid rows and set refund_amount
      await conn.query(
        'UPDATE bids SET deposit_refunded = 1, refund_amount = deposit_paid WHERE auction_id = ? AND bidder_id = ? AND deposit_paid > 0 AND deposit_refunded = 0',
        [auctionId, bidderId]
      );

      // Notify bidder about refund (sum refunded amount)
      const [sumRes] = await conn.query('SELECT SUM(refund_amount) AS refunded FROM bids WHERE auction_id = ? AND bidder_id = ?', [auctionId, bidderId]);
      const refundedAmt = (sumRes[0] && sumRes[0].refunded) ? Number(sumRes[0].refunded) : total;
      const message = `Your deposit of ${refundedAmt.toFixed(2)} Br for auction ${auction.title} has been refunded.`;
      await conn.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [bidderId, message]);
      if (io) io.to(`user_${bidderId}`).emit('notification', { message, auctionId: Number(auctionId) });
    }

    // Emit auction_closed to room
    if (io) io.to(`auction_${auctionId}`).emit('auction_closed', { auctionId: Number(auctionId), winnerId, finalPrice });

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
  const { title, description, category, image_url, start_price, ends_at, min_increment, max_increment, reserve_price, buy_now_price } = req.body;
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
      // Calculate refundable deposit as 25% of start price
      const deposit = Math.round(Number(start_price) * 0.25 * 100) / 100;
      const reserve = reserve_price ? Number(reserve_price) : null;
      const buyNow = buy_now_price ? Number(buy_now_price) : null;
      // Validate reserve and buy-now if provided
      const sp = Number(start_price);
      if (reserve !== null && (Number.isNaN(reserve) || reserve < 0)) return res.status(400).json({ message: 'reserve_price must be a valid non-negative number' });
      if (reserve !== null && reserve < sp) return res.status(400).json({ message: 'reserve_price must be greater than or equal to starting price' });
      if (buyNow !== null && (Number.isNaN(buyNow) || buyNow < 0)) return res.status(400).json({ message: 'buy_now_price must be a valid non-negative number' });
      if (buyNow !== null && buyNow < sp) return res.status(400).json({ message: 'buy_now_price must be greater than or equal to starting price' });
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
        `INSERT INTO auctions (seller_id, title, description, category, image_url, start_price, current_price, min_increment, max_increment, deposit_amount, reserve_price, buy_now_price, ends_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
        [req.user.id, title, description, category, finalImageUrl, start_price, start_price, mi, ma, deposit, reserve, buyNow, ends_at]
      );
      // Fetch the newly created auction for broadcasting
      const [[newAuction]] = await pool.query(
        `SELECT a.id, a.title, a.description, a.category, a.image_url, a.start_price, a.current_price, a.min_increment, a.max_increment, a.deposit_amount, a.reserve_price, a.buy_now_price, a.winner_id, a.final_price, a.ends_at, a.status, u.name AS seller_name
           FROM auctions a
           JOIN users u ON u.id = a.seller_id
          WHERE a.id = ?`,
        [result.insertId]
      );

      // Broadcast the new auction to all connected clients (including unauthenticated visitors)
      try {
        const io = req.app.get('io');
        if (io && newAuction) {
          io.emit('auction_created', newAuction);
          // Also notify admins specifically about a newly created pending auction
          try {
            io.to('admins').emit('auction_pending', newAuction);
          } catch (e) {
            // continue even if admin room emit fails
            console.warn('Failed to emit auction_pending to admins', e);
          }
          // Also notify all clients to increment admin badge count (so guests see the red badge)
          try { io.emit('admin_badge_increment', { type: 'auction' }) } catch (e) { console.warn('Failed to emit admin_badge_increment', e) }
        }
      } catch (err) {
        console.error('Failed to emit auction_created', err);
      }

      res.status(201).json({ id: result.insertId });
    } catch (e) {
      console.error('Create auction error', e);
      res.status(500).json({ message: 'Failed to create auction' });
    }
  }
);

export default router;



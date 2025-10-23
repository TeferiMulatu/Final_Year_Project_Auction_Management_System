import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(['BIDDER']),
  [body('auction_id').isInt({ gt: 0 }), body('amount').isFloat({ gt: 0 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { auction_id, amount } = req.body;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query('SELECT id, current_price, ends_at, status FROM auctions WHERE id = ? FOR UPDATE', [auction_id]);
      if (!rows.length) {
        await conn.rollback();
        return res.status(404).json({ message: 'Auction not found' });
      }
      const auction = rows[0];
      if (auction.status !== 'APPROVED') {
        await conn.rollback();
        return res.status(400).json({ message: 'Auction not active' });
      }
      const now = new Date();
      if (now > new Date(auction.ends_at)) {
        await conn.rollback();
        return res.status(400).json({ message: 'Auction ended' });
      }
      if (Number(amount) <= Number(auction.current_price)) {
        await conn.rollback();
        return res.status(400).json({ message: 'Bid must be higher than current price' });
      }

      const [result] = await conn.query(
        'INSERT INTO bids (auction_id, bidder_id, amount) VALUES (?, ?, ?)',
        [auction_id, req.user.id, amount]
      );
      await conn.query('UPDATE auctions SET current_price = ? WHERE id = ?', [amount, auction_id]);
      await conn.commit();

      const io = req.app.get('io');
      io.to(`auction_${auction_id}`).emit('bid_update', { auctionId: auction_id, amount, bidderId: req.user.id });
      res.status(201).json({ id: result.insertId });
    } catch (e) {
      await conn.rollback();
      res.status(500).json({ message: 'Failed to place bid' });
    } finally {
      conn.release();
    }
  }
);

// Bidder: get my bids
router.get('/my-bids', authenticate, authorize(['BIDDER']), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.id, b.amount, b.created_at, 
              a.id as auction_id, a.title, a.category, a.image_url, a.current_price, a.ends_at
       FROM bids b
       JOIN auctions a ON a.id = b.auction_id
       WHERE b.bidder_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    
    // Transform the data to match frontend expectations
    const bids = rows.map(row => ({
      id: row.id,
      amount: row.amount,
      created_at: row.created_at,
      auction: {
        id: row.auction_id,
        title: row.title,
        category: row.category,
        image_url: row.image_url,
        current_price: row.current_price,
        ends_at: row.ends_at
      }
    }));
    
    res.json(bids);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch bids' });
  }
});

export default router;



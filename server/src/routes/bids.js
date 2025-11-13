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
    // Debug: log incoming request info
    try {
      console.log('Incoming bid request', { body: req.body, user: req.user?.id, auth: req.headers.authorization?.slice(0,20) });
    } catch (e) { console.warn('Failed to log bid request', e) }
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { auction_id, amount } = req.body;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query('SELECT id, current_price, ends_at, status, min_increment, max_increment FROM auctions WHERE id = ? FOR UPDATE', [auction_id]);
      if (!rows.length) {
        await conn.rollback();
        return res.status(404).json({ message: 'Auction not found' });
      }
      const auction = rows[0];
      // Debug: log incoming bid attempt and auction increments
      console.log(`Bid attempt: auction=${auction_id} user=${req.user?.id} amount=${amount} current_price=${auction.current_price} min_inc=${auction.min_increment} max_inc=${auction.max_increment}`);
      if (auction.status !== 'APPROVED') {
        await conn.rollback();
        return res.status(400).json({ message: 'Auction not active' });
      }
      const now = new Date();
      if (now > new Date(auction.ends_at)) {
        await conn.rollback();
        return res.status(400).json({ message: 'Auction ended' });
      }
      const minInc = Number(auction.min_increment || 1);
      const maxInc = auction.max_increment ? Number(auction.max_increment) : null;
      const minAllowed = Number(auction.current_price) + minInc;
      if (Number(amount) < minAllowed) {
        // Log rejection reason
        console.log(`Bid rejected: amount ${amount} < minAllowed ${minAllowed}`);
        await conn.rollback();
        return res.status(400).json({ message: `Bid must be at least ${minInc.toFixed(2)} higher than current price (min allowed: ${minAllowed.toFixed(2)})` });
      }
      if (maxInc !== null) {
        const maxAllowed = Number(auction.current_price) + maxInc;
        if (Number(amount) > maxAllowed) {
          console.log(`Bid rejected: amount ${amount} > maxAllowed ${maxAllowed}`);
          await conn.rollback();
          return res.status(400).json({ message: `Bid cannot exceed max increment of ${maxInc.toFixed(2)} (max allowed: ${maxAllowed.toFixed(2)})` });
        }
      }

      const [result] = await conn.query(
        'INSERT INTO bids (auction_id, bidder_id, amount) VALUES (?, ?, ?)',
        [auction_id, req.user.id, amount]
      );
      await conn.query('UPDATE auctions SET current_price = ? WHERE id = ?', [amount, auction_id]);
      await conn.commit();

      // Respond success before emitting socket events so socket failures don't turn into DB rollbacks
      res.status(201).json({ id: result.insertId });

      // Emit bid update asynchronously; failures here should not affect DB transaction
      try {
        const io = req.app.get('io');
        if (io) {
          io.to(`auction_${auction_id}`).emit('bid_update', { auctionId: auction_id, amount, bidderId: req.user.id, bidderName: req.user.name || null });
        }
      } catch (emitErr) {
        console.error('Socket emit failed for bid_update:', emitErr && emitErr.stack ? emitErr.stack : emitErr);
      }
    } catch (e) {
      try { await conn.rollback(); } catch (rbErr) { console.warn('Rollback failed', rbErr && rbErr.message); }
      console.error('Place bid error:', e && e.stack ? e.stack : e);
      const isDev = process.env.NODE_ENV !== 'production';
      res.status(500).json({ message: 'Failed to place bid', error: isDev ? e.message : undefined });
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
              a.id as auction_id, a.title, a.category, a.image_url, a.current_price, a.ends_at, a.winner_id, a.final_price, a.status
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
        ends_at: row.ends_at,
        winner_id: row.winner_id,
        final_price: row.final_price,
        status: row.status
      }
    }));
    
    res.json(bids);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch bids' });
  }
});

export default router;



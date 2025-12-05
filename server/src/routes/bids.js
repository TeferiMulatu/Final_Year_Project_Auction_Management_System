import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(['BIDDER']),
  [body('auction_id').isInt({ gt: 0 }), body('amount').isFloat({ gt: 0 }), body('deposit_paid').isFloat({ gt: 0 })],
  async (req, res) => {
    // Debug: log incoming request info
    try {
      console.log('Incoming bid request', { body: req.body, user: req.user?.id, auth: req.headers.authorization?.slice(0,20) });
    } catch (e) { console.warn('Failed to log bid request', e) }
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { auction_id, amount, deposit_paid } = req.body;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query('SELECT id, title, current_price, ends_at, status, min_increment, max_increment, deposit_amount, reserve_price, buy_now_price FROM auctions WHERE id = ? FOR UPDATE', [auction_id]);
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
      const buyNow = auction.buy_now_price ? Number(auction.buy_now_price) : null;
      const isBuyNowBid = buyNow !== null && Number(amount) === buyNow;
      const minAllowed = Number(auction.current_price) + minInc;
      if (!isBuyNowBid && Number(amount) < minAllowed) {
        // Log rejection reason
        console.log(`Bid rejected: amount ${amount} < minAllowed ${minAllowed}`);
        await conn.rollback();
        return res.status(400).json({ message: `Bid must be at least ${minInc.toFixed(2)} higher than current price (min allowed: ${minAllowed.toFixed(2)})` });
      }
      if (!isBuyNowBid && maxInc !== null) {
        const maxAllowed = Number(auction.current_price) + maxInc;
        if (Number(amount) > maxAllowed) {
          console.log(`Bid rejected: amount ${amount} > maxAllowed ${maxAllowed}`);
          await conn.rollback();
          return res.status(400).json({ message: `Bid cannot exceed max increment of ${maxInc.toFixed(2)} (max allowed: ${maxAllowed.toFixed(2)})` });
        }
      }

      // Ensure bidder provided required deposit amount
      const requiredDeposit = Number(auction.deposit_amount || 0);
      if (requiredDeposit > 0 && Number(deposit_paid) < requiredDeposit) {
        await conn.rollback();
        return res.status(400).json({ message: `You must pay a refundable deposit of at least ${requiredDeposit.toFixed(2)} to place a bid` });
      }

      const [result] = await conn.query(
        'INSERT INTO bids (auction_id, bidder_id, amount, deposit_paid) VALUES (?, ?, ?, ?)',
        [auction_id, req.user.id, amount, Number(deposit_paid) || 0]
      );
      await conn.query('UPDATE auctions SET current_price = ? WHERE id = ?', [amount, auction_id]);

      // If buy-now price is set and bid meets or exceeds it, close auction immediately
      if (buyNow !== null && Number(amount) >= buyNow) {
        const finalPrice = buyNow;
        // Mark auction closed and winner
        await conn.query('UPDATE auctions SET status = ?, winner_id = ?, final_price = ? WHERE id = ?', ['CLOSED', req.user.id, finalPrice, auction_id]);

        // Refund non-winning bidders and notify
        const [bidderSums] = await conn.query(
          'SELECT bidder_id, SUM(deposit_paid) AS total_deposit FROM bids WHERE auction_id = ? GROUP BY bidder_id',
          [auction_id]
        );
        const io = req.app.get('io');
        for (const b of bidderSums) {
          const bidderId = b.bidder_id;
          const total = Number(b.total_deposit || 0);
          if (total <= 0) continue;
          if (Number(bidderId) === Number(req.user.id)) {
            // Winner: hold deposit
            const msg = `Your deposit of ${total.toFixed(2)} Br for auction ${auction.title} is being held pending payment.`;
            await conn.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [bidderId, msg]);
            if (io) io.to(`user_${bidderId}`).emit('notification', { message: msg, auctionId: Number(auction_id) });
            continue;
          }
          await conn.query(
            'UPDATE bids SET deposit_refunded = 1, refund_amount = deposit_paid WHERE auction_id = ? AND bidder_id = ? AND deposit_paid > 0 AND deposit_refunded = 0',
            [auction_id, bidderId]
          );
          const [sumRes] = await conn.query('SELECT SUM(refund_amount) AS refunded FROM bids WHERE auction_id = ? AND bidder_id = ?', [auction_id, bidderId]);
          const refundedAmt = (sumRes[0] && sumRes[0].refunded) ? Number(sumRes[0].refunded) : total;
          const message = `Your deposit of ${refundedAmt.toFixed(2)} Br for auction ${auction.title} has been refunded.`;
          await conn.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [bidderId, message]);
          if (io) io.to(`user_${bidderId}`).emit('notification', { message, auctionId: Number(auction_id) });
        }

        await conn.commit();
        // Respond and emit auction_closed
        res.status(201).json({ id: result.insertId, buyNow: true });
        try {
          const io2 = req.app.get('io');
          if (io2) io2.to(`auction_${auction_id}`).emit('auction_closed', { auctionId: auction_id, winnerId: req.user.id, finalPrice });
        } catch (emitErr) { console.error('Socket emit failed for auction_closed:', emitErr && emitErr.stack ? emitErr.stack : emitErr); }
        return;
      }

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
      `SELECT b.id, b.amount, b.created_at, b.deposit_paid, b.deposit_refunded, b.refund_amount,
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
      deposit_paid: row.deposit_paid,
      deposit_refunded: Boolean(row.deposit_refunded),
      refund_amount: row.refund_amount,
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



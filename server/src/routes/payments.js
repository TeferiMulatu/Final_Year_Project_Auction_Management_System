import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Simulated payment endpoint - accepts a payment for a finished auction
router.post('/', authenticate, authorize(['BIDDER']), async (req, res) => {
  const { auction_id, amount, method } = req.body;
  if (!auction_id || !amount) return res.status(400).json({ message: 'auction_id and amount required' });

  try {
    const [[auction]] = await pool.query('SELECT id, current_price, ends_at, status FROM auctions WHERE id = ?', [auction_id]);
    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    const now = new Date();
    if (new Date(auction.ends_at) > now) return res.status(400).json({ message: 'Auction has not ended' });

    // NOTE: This is a simulated payment flow. In a real system you would integrate a payment
    // gateway (Stripe/PayPal) and verify the payer actually won the auction. For now mark
    // the auction as PAID and return success.
    await pool.query('UPDATE auctions SET status = ? WHERE id = ?', ['PAID', auction_id]);

    // Optionally insert into a payments table if exists (not implemented here)
    return res.json({ ok: true, message: 'Payment recorded (simulated)' });
  } catch (e) {
    console.error('Payment error', e);
    return res.status(500).json({ message: 'Failed to process payment' });
  }
});

export default router;

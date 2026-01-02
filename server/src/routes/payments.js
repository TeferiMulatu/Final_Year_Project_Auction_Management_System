import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Simulated payment endpoint - accepts a payment for a finished auction
router.post('/', authenticate, authorize(['BIDDER']), async (req, res) => {
  const { auction_id, amount, method } = req.body;
  if (!auction_id || !amount) return res.status(400).json({ message: 'auction_id and amount required' });

  try {
    const [[auction]] = await pool.query('SELECT id, current_price, final_price, ends_at, status, winner_id, seller_id FROM auctions WHERE id = ?', [auction_id]);
    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    const now = new Date();
    if (new Date(auction.ends_at) > now) return res.status(400).json({ message: 'Auction has not ended' });
    if (!auction.winner_id || Number(auction.winner_id) !== Number(req.user.id)) return res.status(403).json({ message: 'You are not the winner of this auction' });
    const finalPrice = Number(auction.final_price || auction.current_price || 0);
    if (Number(amount) !== Number(finalPrice)) return res.status(400).json({ message: 'Payment amount must equal the auction final price' });

    // Calculate any held refundable deposit for the winner for this auction
    const [[heldSumRow]] = await pool.query('SELECT IFNULL(SUM(deposit_paid),0) AS held FROM bids WHERE auction_id = ? AND bidder_id = ? AND deposit_paid > 0 AND deposit_refunded = 0', [auction_id, req.user.id]);
    const heldDeposit = Number(heldSumRow && heldSumRow.held ? heldSumRow.held : 0);

    // Perform simulated transfer: deduct winner, credit seller, credit admin commission, record transactions
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [winnerRows] = await conn.query('SELECT balance FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
      const winnerBal = winnerRows && winnerRows[0] ? Number(winnerRows[0].balance || 0) : 0;
      const amountToDeduct = Math.max(0, finalPrice - heldDeposit);
      if (winnerBal < amountToDeduct) {
        await conn.rollback();
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      const commissionRate = Number(process.env.COMMISSION_RATE || 0.05);
      const commission = Math.round(finalPrice * commissionRate * 100) / 100;
      const sellerShare = Math.round((finalPrice - commission) * 100) / 100;

      // Deduct winner: charge full finalPrice then return held deposit (net charged = finalPrice - heldDeposit)
      if (finalPrice > 0) {
        await conn.query('UPDATE users SET balance = balance - ? WHERE id = ?', [finalPrice, req.user.id]);
        await conn.query('INSERT INTO transactions (user_id, type, amount, auction_id, related_user_id, note) VALUES (?, ?, ?, ?, ?, ?)', [req.user.id, 'AUCTION_PAYMENT', finalPrice, auction_id, auction.seller_id, 'Payment for won auction']);
      }
      // If there was a held deposit, return it to the winner (refund) and mark bids as refunded
      if (heldDeposit > 0) {
        await conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [heldDeposit, req.user.id]);
        await conn.query('INSERT INTO transactions (user_id, type, amount, auction_id, note) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'DEPOSIT_REFUND', heldDeposit, auction_id, `Return of held deposit for auction ${auction_id}`]);
        await conn.query('UPDATE bids SET deposit_refunded = 1, refund_amount = deposit_paid WHERE auction_id = ? AND bidder_id = ? AND deposit_paid > 0 AND deposit_refunded = 0', [auction_id, req.user.id]);
      }

      // Credit seller
      await conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [sellerShare, auction.seller_id]);
      await conn.query('INSERT INTO transactions (user_id, type, amount, auction_id, related_user_id, note) VALUES (?, ?, ?, ?, ?, ?)', [auction.seller_id, 'SALE_PROCEEDS', sellerShare, auction_id, req.user.id, 'Proceeds from auction (after commission)']);

      // Credit admin (user id 1)
      if (commission > 0) {
        await conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [commission, 1]);
        await conn.query('INSERT INTO transactions (user_id, type, amount, auction_id, related_user_id, note) VALUES (?, ?, ?, ?, ?, ?)', [1, 'COMMISSION', commission, auction_id, req.user.id, 'Platform commission']);
      }

      // Mark auction as paid (flag)
      await conn.query('UPDATE auctions SET is_paid = 1 WHERE id = ?', [auction_id]);
      await conn.commit();
      return res.json({ ok: true, message: 'Payment processed (simulated)' });
    } catch (innerErr) {
      await conn.rollback();
      throw innerErr;
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('Payment error', e);
    return res.status(500).json({ message: 'Failed to process payment' });
  }
});

export default router;

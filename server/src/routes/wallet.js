import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get current user's wallet balance and recent transactions
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('Wallet endpoint invoked', { user: req.user && { id: req.user.id, role: req.user.role } });
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const [rows] = await pool.query('SELECT id, name, email, balance FROM users WHERE id = ?', [userId]);
    const user = rows && rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [transactions] = await pool.query(
      'SELECT id, type, amount, related_user_id, auction_id, note, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
      [userId]
    );

    // Fetch wallet top-up requests for this user
    const [topups] = await pool.query(
      'SELECT id, amount, status, note, created_at, processed_at FROM wallet_topups WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
      [userId]
    );

    res.json({ balance: Number(user.balance || 0), transactions, topups });
  } catch (e) {
    console.error('Wallet fetch error', e && e.stack ? e.stack : e);
    res.status(500).json({ message: 'Failed to fetch wallet' });
  }
});

// Request a wallet top-up (creates a pending top-up for admin approval)
router.post('/topup', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, note } = req.body;
    const amt = Number(amount || 0);
    if (!amt || amt <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const [result] = await pool.query('INSERT INTO wallet_topups (user_id, amount, note) VALUES (?, ?, ?)', [userId, amt, note || null]);

    // Notify admins via socket if available
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('admin_badge_increment', { type: 'topup' });
      }
    } catch (e) { /* ignore socket failures */ }

    res.status(201).json({ ok: true, id: result.insertId });
  } catch (e) {
    console.error('Topup request failed', e && e.stack ? e.stack : e);
    res.status(500).json({ message: 'Failed to create top-up request' });
  }
});

export default router;

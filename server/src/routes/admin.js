import { Router } from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, authorize(['ADMIN']));

// Approve or reject auction
router.post('/auctions/:id/approve', async (req, res) => {
  try {
    await pool.query('UPDATE auctions SET status = "APPROVED" WHERE id = ?', [req.params.id]);
    // Fetch approved auction and broadcast to public viewers
    try {
      const [[auction]] = await pool.query(
        `SELECT a.id, a.title, a.description, a.category, a.image_url, a.start_price, a.current_price, a.min_increment, a.max_increment, a.deposit_amount, a.reserve_price, a.buy_now_price, a.winner_id, a.final_price, a.ends_at, a.status, u.name AS seller_name
           FROM auctions a
           JOIN users u ON u.id = a.seller_id
          WHERE a.id = ?`,
        [req.params.id]
      );
      const io = req.app.get('io');
      if (io && auction) {
        io.emit('auction_created', auction);
        // Decrement admin badge because one pending auction became approved
        try { io.emit('admin_badge_decrement', { type: 'auction' }) } catch (e) { console.warn('Failed to emit admin_badge_decrement', e) }
      }
    } catch (err) {
      console.error('Failed to fetch/emit approved auction', err);
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to approve' });
  }
});

router.post('/auctions/:id/reject', async (req, res) => {
  try {
    await pool.query('UPDATE auctions SET status = "REJECTED" WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to reject' });
  }
});

// Users management
router.get('/users', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, is_active, fin_number, id_front_url, id_back_url FROM users');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.post('/users/:id/toggle', async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_active = 1 - is_active WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to toggle user' });
  }
});

// Admin dashboard stats
router.get('/stats', async (_req, res) => {
  try {
    const [[{ count: users }]] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [[{ count: auctions }]] = await pool.query('SELECT COUNT(*) as count FROM auctions');
    const [[{ count: bids }]] = await pool.query('SELECT COUNT(*) as count FROM bids');
    res.json({ users, auctions, bids });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load stats' });
  }
});

// Get pending auctions for approval
router.get('/pending-auctions', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.title, a.description, a.category, a.image_url, a.start_price, a.ends_at, u.name AS seller_name
       FROM auctions a
       JOIN users u ON u.id = a.seller_id
       WHERE a.status = 'PENDING'
       ORDER BY a.created_at ASC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch pending auctions' });
  }
});

export default router;

// Admin: approve a user (activate account)
router.post('/users/:id/approve', async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_active = 1 WHERE id = ?', [req.params.id]);
    // Notify clients that a pending user was approved so badge can decrement
    try {
      const io = req.app.get('io');
      if (io) io.emit('admin_badge_decrement', { type: 'user' });
    } catch (e) { console.warn('Failed to emit admin_badge_decrement for user', e) }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to approve user' });
  }
});

// Admin: reset a user's password
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required' });
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
});



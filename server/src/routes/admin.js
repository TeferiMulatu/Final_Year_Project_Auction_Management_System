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

// Get pending wallet top-up requests
router.get('/wallet-topups', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT wt.id, wt.user_id, wt.amount, wt.status, wt.note, wt.created_at, u.name, u.email
       FROM wallet_topups wt
       JOIN users u ON u.id = wt.user_id
       ORDER BY wt.created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error('Failed to fetch wallet topups', e && e.stack ? e.stack : e);
    res.status(500).json({ message: 'Failed to fetch wallet topups' });
  }
});

// Approve a wallet top-up request
router.post('/wallet-topups/:id/approve', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[topup]] = await conn.query('SELECT * FROM wallet_topups WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!topup) {
      await conn.rollback();
      return res.status(404).json({ message: 'Top-up request not found' });
    }
    if (topup.status !== 'PENDING') {
      await conn.rollback();
      return res.status(400).json({ message: 'Top-up already processed' });
    }

    // Credit user balance
    await conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [topup.amount, topup.user_id]);
    await conn.query('INSERT INTO transactions (user_id, type, amount, note) VALUES (?, ?, ?, ?)', [topup.user_id, 'TOPUP', topup.amount, `Top-up approved (request ${topup.id})`]);

    // Mark topup approved
    await conn.query('UPDATE wallet_topups SET status = ?, admin_id = ?, processed_at = NOW() WHERE id = ?', ['APPROVED', req.user.id, req.params.id]);

    // Insert notification and emit to user
    const msg = `Your top-up request of ${Number(topup.amount).toFixed(2)} ETB has been approved.`;
    await conn.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [topup.user_id, msg]);
    try { const io = req.app.get('io'); if (io) io.to(`user_${topup.user_id}`).emit('notification', { message: msg }); } catch (e) {}

    await conn.commit();

    // Decrement admin badge
    try { const io = req.app.get('io'); if (io) io.emit('admin_badge_decrement', { type: 'topup' }); } catch (e) {}

    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error('Failed to approve wallet topup', e && e.stack ? e.stack : e);
    res.status(500).json({ message: 'Failed to approve top-up' });
  } finally {
    conn.release();
  }
});

// Reject a wallet top-up request
router.post('/wallet-topups/:id/reject', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM wallet_topups WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Top-up request not found' });
    const topup = rows[0];
    if (topup.status !== 'PENDING') return res.status(400).json({ message: 'Top-up already processed' });

    await pool.query('UPDATE wallet_topups SET status = ?, admin_id = ?, processed_at = NOW() WHERE id = ?', ['REJECTED', req.user.id, req.params.id]);
    const msg = `Your top-up request of ${Number(topup.amount).toFixed(2)} ETB has been rejected by admin.`;
    await pool.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [topup.user_id, msg]);
    try { const io = req.app.get('io'); if (io) io.to(`user_${topup.user_id}`).emit('notification', { message: msg }); } catch (e) {}

    try { const io = req.app.get('io'); if (io) io.emit('admin_badge_decrement', { type: 'topup' }); } catch (e) {}

    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to reject wallet topup', e && e.stack ? e.stack : e);
    res.status(500).json({ message: 'Failed to reject top-up' });
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



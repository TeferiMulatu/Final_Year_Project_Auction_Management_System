import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, authorize(['ADMIN']));

// Approve or reject auction
router.post('/auctions/:id/approve', async (req, res) => {
  try {
    await pool.query('UPDATE auctions SET status = "APPROVED" WHERE id = ?', [req.params.id]);
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
    const [rows] = await pool.query('SELECT id, name, email, role, is_active FROM users');
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



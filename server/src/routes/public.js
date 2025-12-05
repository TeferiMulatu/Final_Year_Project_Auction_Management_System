import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// Public endpoint: return counts used for Admin badge (pending users and pending auctions)
router.get('/admin-badge', async (_req, res) => {
  try {
    const [[{ pendingAuctions }]] = await pool.query("SELECT COUNT(*) AS pendingAuctions FROM auctions WHERE status = 'PENDING'");
    const [[{ pendingUsers }]] = await pool.query('SELECT COUNT(*) AS pendingUsers FROM users WHERE is_active = 0');
    res.json({ pendingAuctions: Number(pendingAuctions || 0), pendingUsers: Number(pendingUsers || 0) });
  } catch (e) {
    console.error('Failed to fetch admin-badge counts', e);
    res.status(500).json({ message: 'Failed to fetch badge counts' });
  }
});

export default router;

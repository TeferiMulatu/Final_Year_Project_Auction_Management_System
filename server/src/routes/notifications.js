import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get notifications for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error('Failed to fetch notifications', e);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark a notification as read
router.post('/:id/read', authenticate, async (req, res) => {
  const notifId = req.params.id;
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notifId, req.user.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to mark notification read', e);
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

export default router;

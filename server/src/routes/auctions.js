import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public: list approved auctions with optional search
router.get('/', async (req, res) => {
  const { q } = req.query;
  try {
    const like = `%${q || ''}%`;
    const [rows] = await pool.query(
      `SELECT a.id, a.title, a.description, a.category, a.image_url, a.start_price,
              a.current_price, a.ends_at, a.status, u.name AS seller_name
         FROM auctions a
         JOIN users u ON u.id = a.seller_id
        WHERE a.status = 'APPROVED' AND (a.title LIKE ? OR a.category LIKE ?)
        ORDER BY a.ends_at ASC`,
      [like, like]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Failed to list auctions' });
  }
});

// Public: auction detail
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM auctions WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    const [bids] = await pool.query(
      'SELECT b.id, b.amount, b.created_at, u.name AS bidder_name FROM bids b JOIN users u ON u.id=b.bidder_id WHERE b.auction_id = ? ORDER BY b.created_at DESC',
      [req.params.id]
    );
    res.json({ auction: rows[0], bids });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load auction' });
  }
});

// Seller: create auction (pending approval)
router.post(
  '/',
  authenticate,
  authorize(['SELLER']),
  [
    body('title').isString().isLength({ min: 3 }),
    body('description').isString().isLength({ min: 10 }),
    body('category').isString(),
    body('image_url').isURL(),
    body('start_price').isFloat({ gt: 0 }),
    body('ends_at').isISO8601()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { title, description, category, image_url, start_price, ends_at } = req.body;
    try {
      const [result] = await pool.query(
        `INSERT INTO auctions (seller_id, title, description, category, image_url, start_price, current_price, ends_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
        [req.user.id, title, description, category, image_url, start_price, start_price, ends_at]
      );
      res.status(201).json({ id: result.insertId });
    } catch (e) {
      res.status(500).json({ message: 'Failed to create auction' });
    }
  }
);

// Seller: get my auctions
router.get('/my-auctions', authenticate, authorize(['SELLER']), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM auctions WHERE seller_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch auctions' });
  }
});

export default router;



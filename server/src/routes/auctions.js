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

// Seller: get my auctions (place before parameterized routes to avoid shadowing)
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
    body('title').isString().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('description').isString().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('category').isString().withMessage('Category is required'),
    body('image_url').isURL().withMessage('Image URL must be a valid URL'),
    body('start_price').isFloat({ gt: 0 }).withMessage('Starting price must be greater than 0'),
    body('ends_at').isISO8601().withMessage('End date must be a valid ISO 8601 date')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation error', errors: errors.array() });
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

export default router;



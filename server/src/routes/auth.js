import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { sendMail } from '../utils/mailer.js';

// Multer storage for ID uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, unique);
  }
});
const upload = multer({ storage });

const router = Router();

router.post(
  '/register',
  upload.fields([{ name: 'id_front', maxCount: 1 }, { name: 'id_back', maxCount: 1 }]),
  [
    body('name')
      .isString().withMessage('Name must be a string')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email')
      .isEmail().withMessage('Please enter a valid email address'),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role')
      .isIn(['ADMIN', 'SELLER', 'BIDDER']).withMessage('Role must be ADMIN, SELLER, or BIDDER'),
    body('fin_number')
      .isString().withMessage('FIN number is required')
      .isLength({ min: 3 }).withMessage('FIN seems too short')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    const { name, email, password, role, fin_number } = req.body;

    // Ensure ID images were uploaded
    if (!req.files || !req.files.id_front || !req.files.id_back) {
      return res.status(400).json({ message: 'Both front and back images of National ID are required' });
    }

    try {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length) return res.status(409).json({ message: 'Email already registered' });
      const hashed = await bcrypt.hash(password, 10);

      // Build file URLs
      const host = req.protocol + '://' + req.get('host');
      const idFrontFile = req.files.id_front[0];
      const idBackFile = req.files.id_back[0];
      const idFrontUrl = `${host}/uploads/${idFrontFile.filename}`;
      const idBackUrl = `${host}/uploads/${idBackFile.filename}`;

      const demoBalance = 0.00;
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password_hash, role, is_active, fin_number, id_front_url, id_back_url, balance) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)',
        [name, email, hashed, role, fin_number, idFrontUrl, idBackUrl, demoBalance]
      );
      // New registrations are created as inactive (pending admin approval)
      // Emit socket event to admins so they can refresh user list in real-time
      try {
        const io = req.app.get('io')
        if (io) {
          io.to('admins').emit('user_registered', {
            id: result.insertId,
            name,
            email,
            role,
            is_active: 0,
            fin_number,
            id_front_url: idFrontUrl,
            id_back_url: idBackUrl
          })
          // Also notify all clients to increment admin badge (so guests see the red badge)
          try { io.emit('admin_badge_increment', { type: 'user' }) } catch (e) { console.warn('Failed to emit admin_badge_increment', e) }
        }
      } catch (e) { console.warn('Failed to emit user_registered', e) }
      return res.status(201).json({ id: result.insertId, name, email, role, pending: true });
    } catch (e) {
      console.error('Registration failed', e);
      return res.status(500).json({ message: 'Registration failed' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').isString().withMessage('Password is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    const { email, password } = req.body;
    try {
      const [rows] = await pool.query('SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?', [email]);
      if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });
      const user = rows[0];
      if (!user.is_active) return res.status(403).json({ message: 'Account deactivated' });
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ message: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' });
      return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (e) {
      return res.status(500).json({ message: 'Login failed' });
    }
  }
);

// --- Password reset endpoints ---

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please enter a valid email address')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation error', errors: errors.array() });
  const { email } = req.body;
  try {
    const [rows] = await pool.query('SELECT id, name, email FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(200).json({ ok: true }); // do not reveal whether email exists
    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Store token
    await pool.query('INSERT INTO password_resets (user_id, token_hash, expires_at, used) VALUES (?, ?, ?, 0)', [user.id, tokenHash, expiresAt]);

    // Send email with reset link
    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const resetLink = `${clientOrigin.replace(/\/$/, '')}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    const subject = 'Password reset for MAU Auction';
    const html = `<p>Hello ${user.name || ''},</p><p>We received a request to reset your password. Click the link below to set a new password (valid for 1 hour):</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, you can safely ignore this email.</p>`;
    try {
      await sendMail({ to: email, subject, html, text: `Reset your password: ${resetLink}` });
    } catch (mailErr) {
      console.warn('Failed to send reset email', mailErr && mailErr.message ? mailErr.message : mailErr);
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error('Forgot password error', e && e.stack ? e.stack : e);
    return res.status(500).json({ message: 'Failed to process request' });
  }
});

router.post('/reset-password', [
  body('email').isEmail(),
  body('token').isString().notEmpty(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation error', errors: errors.array() });
  const { email, token, password } = req.body;
  try {
    const [urows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!urows.length) return res.status(400).json({ message: 'Invalid token or email' });
    const user = urows[0];
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await pool.query('SELECT id, expires_at, used FROM password_resets WHERE user_id = ? AND token_hash = ? ORDER BY id DESC LIMIT 1', [user.id, tokenHash]);
    if (!rows.length) return res.status(400).json({ message: 'Invalid token or email' });
    const rec = rows[0];
    if (rec.used) return res.status(400).json({ message: 'Token already used' });
    if (new Date(rec.expires_at) < new Date()) return res.status(400).json({ message: 'Token expired' });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, user.id]);
    await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [rec.id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error('Reset password error', e && e.stack ? e.stack : e);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
});

export default router;



// Import core modules and middleware
import express from 'express'; // Web framework for building APIs
import cors from 'cors';       // Middleware to enable Cross-Origin Resource Sharing
import morgan from 'morgan';   // HTTP request logger middleware
import dotenv from 'dotenv';   // Loads environment variables from a .env file
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import fs from 'fs';

// Import route handlers
import authRoutes from './routes/auth.js';       // Routes for user authentication
import auctionRoutes from './routes/auctions.js'; // Routes for auction-related operations
import adminRoutes from './routes/admin.js';     // Routes for admin-specific actions
import bidsRoutes from './routes/bids.js';       // Routes for bidding functionality
import paymentsRoutes from './routes/payments.js'; // Payments (simulated)
import notificationsRoutes from './routes/notifications.js';
import publicRoutes from './routes/public.js';
import walletRoutes from './routes/wallet.js';

// Load environment variables into process.env
dotenv.config();

// Initialize the Express application
const app = express();

// Ensure uploads directory exists and serve it statically
const uploadsDir = path.join(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('Failed to create uploads directory', e);
}
app.use('/uploads', express.static(uploadsDir));

// Enable CORS with dynamic origin and credentials support
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like curl) or any localhost origin in dev
    if (!origin || origin.startsWith('http://localhost')) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));
app.options('*', cors());

// Parse incoming JSON requests
app.use(express.json());

// Log HTTP requests to the console in 'dev' format
app.use(morgan('dev'));

// Health check endpoint to verify API is running
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'MAU Auction API' });
});

// Mount route handlers under specific API paths
app.use('/api/auth', authRoutes);         // Authentication routes
app.use('/api/auctions', auctionRoutes);  // Auction routes
app.use('/api/bids', bidsRoutes);         // Bidding routes
app.use('/api/admin', adminRoutes);       // Admin routes
app.use('/api/payments', paymentsRoutes); // Payment routes (simulated)
app.use('/api/notifications', notificationsRoutes); // User notifications
app.use('/api/public', publicRoutes); // Public helpers (admin badge counts)
app.use('/api/wallet', walletRoutes); // Wallet and transactions

// Global error handler to catch and respond to errors
app.use((err, _req, res, _next) => {
  const status = err.status || 500; // Default to 500 if no status is set
  res.status(status).json({ message: err.message || 'Server error' });
});

// Export the Express app instance for use in other files (e.g., server.js)
export default app;




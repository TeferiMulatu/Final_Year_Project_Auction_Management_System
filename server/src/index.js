import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import pool from './config/db.js'; //  this block to test MySQL connection


const port = process.env.PORT || 5000;
const server = http.createServer(app);
//  Add this block to test MySQL connection
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
  });

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  // Namespace for bidding events
  socket.on('join_auction', (auctionId) => {
    socket.join(`auction_${auctionId}`);
  });
  // Allow clients to join a user-specific room for personal notifications
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });
    // Allow admin clients to join an 'admins' room to receive admin events
    socket.on('join_admin', () => {
      socket.join('admins');
    });
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${port}`);
});



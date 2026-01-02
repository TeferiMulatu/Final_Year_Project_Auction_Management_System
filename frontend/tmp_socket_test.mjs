import { io } from 'socket.io-client';

const sock = io('http://localhost:5000', { transports: ['polling'], timeout: 10000 });

sock.on('connect', () => {
  console.log('connected', sock.id);
  sock.disconnect();
  process.exit(0);
});

sock.on('connect_error', (err) => {
  console.error('connect_error', err && err.message ? err.message : err);
  process.exit(1);
});

sock.on('error', (e) => {
  console.error('error', e);
});

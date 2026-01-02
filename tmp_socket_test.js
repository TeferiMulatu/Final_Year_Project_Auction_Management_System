import { io } from 'socket.io-client';

(async () => {
  try {
    const socket = io('http://localhost:5000', { transports: ['polling'], timeout: 10000 });
    socket.on('connect', () => {
      console.log('connected', socket.id);
      socket.disconnect();
      process.exit(0);
    });
    socket.on('connect_error', (err) => {
      console.error('connect_error', err.message || err);
      process.exit(1);
    });
    socket.on('error', (e) => {
      console.error('error', e);
    });
  } catch (e) {
    console.error('script error', e);
    process.exit(2);
  }
})();

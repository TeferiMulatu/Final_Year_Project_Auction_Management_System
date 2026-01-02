import { io } from 'socket.io-client'

// Prefer websocket transport first to avoid Engine.IO polling handshake issues
// and enable credentials so cookies (if any) are sent with requests.
const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  withCredentials: true,
  reconnection: true,
})

export default socket



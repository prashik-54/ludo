import { io } from 'socket.io-client';

// Set VITE_SERVER_URL in your .env file (client/.env) when deploying.
// Falls back to localhost for local development.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export const socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 800,
  reconnectionDelayMax: 4000,
});

export default socket;

// index.js — server entrypoint. Boots Express (for health checks/CORS)
// and attaches Socket.IO for all real-time game traffic.

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { initSocket } = require('./socket/socketHandler');

const PORT = process.env.PORT || 4000;

// Comma-separated list of allowed frontend origins, e.g.
// "https://ludo-online.vercel.app,http://localhost:5173"
const allowedOrigins = (process.env.CLIENT_ORIGIN || '*')
  .split(',')
  .map((s) => s.trim());

const app = express();
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'ludo-online-server' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

initSocket(io);

server.listen(PORT, () => {
  console.log(`Ludo Online server listening on port ${PORT}`);
});

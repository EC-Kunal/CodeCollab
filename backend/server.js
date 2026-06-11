const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send('CodeCollab Backend is running smoothly!');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  // 1. Listen for code typing and broadcast it
  socket.on('code-update', ({ roomId, code }) => {
    socket.to(roomId).emit('code-receive', code);
  });

  // 2. Listen for terminal execution and broadcast it
  socket.on('terminal-update', ({ roomId, output, color }) => {
    socket.to(roomId).emit('terminal-receive', { output, color });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`WebSocket Server running on http://localhost:${PORT}`);
});
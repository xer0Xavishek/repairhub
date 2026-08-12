const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

const server = http.createServer(app);

// Socket.io Real-time WebSocket setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Join a repair request specific room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`[Socket.io] Client ${socket.id} joined room ${roomId}`);
  });

  // Broadcast message
  socket.on('send_message', (data) => {
    // data: { roomId, ticketNumber, repairRequestId, message }
    if (data?.roomId) {
      let emitter = socket.to(data.roomId);
      if (data.ticketNumber && data.roomId !== `order_${data.ticketNumber}`) {
        emitter = emitter.to(`order_${data.ticketNumber}`);
      }
      if (data.repairRequestId && data.roomId !== `order_${data.repairRequestId}`) {
        emitter = emitter.to(`order_${data.repairRequestId}`);
      }
      emitter.emit('receive_message', data.message);
    } else {
      socket.broadcast.emit('receive_message', data.message);
    }
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`[Socket.io] Client ${socket.id} left room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🚀 RepairHub Backend Server Running`);
    console.log(`📍 Port: http://localhost:${PORT}`);
    console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`========================================`);
  });
}

module.exports = { app, server, io };

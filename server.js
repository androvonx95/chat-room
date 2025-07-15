const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { initializeStorage } = require('./src/utils/storage.js');
const { setupSocketHandlers } = require('./src/socket/socketHandlers.js');

// Route imports
const userRoutes = require('./src/routes/userRoutes.js');
const messageRoutes = require('./src/routes/messageRoutes.js');
const roomRoutes = require('./src/routes/roomRoutes.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Simple Chatroom Server API',
    endpoints: {
      users: {
        'POST /api/users': 'Create user',
        'GET /api/users': 'Get all users',
        'GET /api/users/:id': 'Get user by ID',
        'PATCH /api/users/:id/status': 'Update user status'
      },
      messages: {
        'POST /api/messages/direct': 'Send direct message',
        'GET /api/messages/direct/:userId1/:userId2': 'Get messages between users',
        'GET /api/messages/user/:userId': 'Get all messages for user'
      },
      rooms: {
        'POST /api/rooms': 'Create room',
        'GET /api/rooms': 'Get all rooms',
        'GET /api/rooms/:id': 'Get room by ID',
        'POST /api/rooms/:roomId/join': 'Join room',
        'POST /api/rooms/:roomId/messages': 'Send message to room',
        'GET /api/rooms/:roomId/messages': 'Get room messages'
      }
    }
  });
});

// Setup socket handlers
setupSocketHandlers(io);

// Start server
const startServer = async () => {
  await initializeStorage();
  
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO server ready`);
    console.log(`Visit http://localhost:${PORT} for API documentation`);
  });
};

startServer();
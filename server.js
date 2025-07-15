

// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

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

// Simple in-memory storage (you can switch to JSON file if needed)
let users = [];
let messages = [];
let rooms = [];

// Data file paths
const DATA_DIR = './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json');

// Initialize data storage
const initializeStorage = async () => {
try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Load existing data or create empty files
    try {
    const usersData = await fs.readFile(USERS_FILE, 'utf8');
    users = JSON.parse(usersData);
    } catch (error) {
    users = [];
    await saveUsers();
    }
    
    try {
    const messagesData = await fs.readFile(MESSAGES_FILE, 'utf8');
    messages = JSON.parse(messagesData);
    } catch (error) {
    messages = [];
    await saveMessages();
    }
    
    try {
    const roomsData = await fs.readFile(ROOMS_FILE, 'utf8');
    rooms = JSON.parse(roomsData);
    } catch (error) {
    rooms = [];
    await saveRooms();
    }
    
    console.log('Storage initialized successfully');
} catch (error) {
    console.error('Error initializing storage:', error);
}
};

// Save functions
const saveUsers = async () => {
await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
};

const saveMessages = async () => {
await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
};

const saveRooms = async () => {
await fs.writeFile(ROOMS_FILE, JSON.stringify(rooms, null, 2));
};

// Utility functions
const generateId = () => {
return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const findUserById = (id) => {
return users.find(user => user.id === id);
};

const findUserByUsername = (username) => {
return users.find(user => user.username === username);
};

// ===== USER ROUTES =====

// Create a new user
app.post('/api/users', async (req, res) => {
try {
    const { username } = req.body;
    
    if (!username) {
    return res.status(400).json({ error: 'Username is required' });
    }
    
    if (findUserByUsername(username)) {
    return res.status(400).json({ error: 'Username already exists' });
    }
    
    const newUser = {
    id: generateId(),
    username,
    isOnline: true,
    createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await saveUsers();
    
    res.status(201).json({
    message: 'User created successfully',
    user: newUser
    });
} catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
}
});

// Get all users
app.get('/api/users', (req, res) => {
res.json(users);
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
const { id } = req.params;
const user = findUserById(id);

if (!user) {
    return res.status(404).json({ error: 'User not found' });
}

res.json(user);
});

// Update user online status
app.patch('/api/users/:id/status', async (req, res) => {
try {
    const { id } = req.params;
    const { isOnline } = req.body;
    
    const user = findUserById(id);
    if (!user) {
    return res.status(404).json({ error: 'User not found' });
    }
    
    user.isOnline = isOnline;
    await saveUsers();
    
    // Emit status change to all clients
    io.emit('userStatusChanged', { userId: id, isOnline });
    
    res.json({ message: 'Status updated successfully', user });
} catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Internal server error' });
}
});

// ===== MESSAGE ROUTES =====

// Send a direct message to a user by ID
app.post('/api/messages/direct', async (req, res) => {
try {
    const { senderId, receiverId, content } = req.body;
    
    if (!senderId || !receiverId || !content) {
    return res.status(400).json({ error: 'senderId, receiverId, and content are required' });
    }
    
    const sender = findUserById(senderId);
    const receiver = findUserById(receiverId);
    
    if (!sender) {
    return res.status(404).json({ error: 'Sender not found' });
    }
    
    if (!receiver) {
    return res.status(404).json({ error: 'Receiver not found' });
    }
    
    const message = {
    id: generateId(),
    senderId,
    receiverId,
    senderUsername: sender.username,
    receiverUsername: receiver.username,
    content,
    timestamp: new Date().toISOString(),
    type: 'direct'
    };
    
    messages.push(message);
    await saveMessages();
    
    // Emit message to connected clients
    io.emit('newMessage', message);
    
    res.status(201).json({
    message: 'Message sent successfully',
    data: message
    });
} catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
}
});

// Get messages between two users
app.get('/api/messages/direct/:userId1/:userId2', (req, res) => {
const { userId1, userId2 } = req.params;

const directMessages = messages.filter(msg => 
    msg.type === 'direct' && (
    (msg.senderId === userId1 && msg.receiverId === userId2) ||
    (msg.senderId === userId2 && msg.receiverId === userId1)
    )
).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

res.json(directMessages);
});

// Get all messages for a user (sent and received)
app.get('/api/messages/user/:userId', (req, res) => {
const { userId } = req.params;

const userMessages = messages.filter(msg => 
    msg.senderId === userId || msg.receiverId === userId
).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

res.json(userMessages);
});

// ===== ROOM ROUTES =====

// Create a new room
app.post('/api/rooms', async (req, res) => {
try {
    const { name, creatorId } = req.body;
    
    if (!name || !creatorId) {
    return res.status(400).json({ error: 'Room name and creator ID are required' });
    }
    
    const creator = findUserById(creatorId);
    if (!creator) {
    return res.status(404).json({ error: 'Creator not found' });
    }
    
    const room = {
    id: generateId(),
    name,
    creatorId,
    creatorUsername: creator.username,
    members: [creatorId],
    createdAt: new Date().toISOString()
    };
    
    rooms.push(room);
    await saveRooms();
    
    res.status(201).json({
    message: 'Room created successfully',
    room
    });
} catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Internal server error' });
}
});

// Get all rooms
app.get('/api/rooms', (req, res) => {
res.json(rooms);
});

// Get room by ID
app.get('/api/rooms/:id', (req, res) => {
const { id } = req.params;
const room = rooms.find(r => r.id === id);

if (!room) {
    return res.status(404).json({ error: 'Room not found' });
}

res.json(room);
});

// Join a room
app.post('/api/rooms/:roomId/join', async (req, res) => {
try {
    const { roomId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
    }
    
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
    return res.status(404).json({ error: 'Room not found' });
    }
    
    const user = findUserById(userId);
    if (!user) {
    return res.status(404).json({ error: 'User not found' });
    }
    
    if (room.members.includes(userId)) {
    return res.status(400).json({ error: 'User is already a member of this room' });
    }
    
    room.members.push(userId);
    await saveRooms();
    
    // Emit room joined event
    io.emit('userJoinedRoom', { roomId, userId, username: user.username });
    
    res.json({ message: 'Successfully joined room' });
} catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Internal server error' });
}
});

// Send message to room
app.post('/api/rooms/:roomId/messages', async (req, res) => {
try {
    const { roomId } = req.params;
    const { senderId, content } = req.body;
    
    if (!senderId || !content) {
    return res.status(400).json({ error: 'Sender ID and content are required' });
    }
    
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
    return res.status(404).json({ error: 'Room not found' });
    }
    
    const sender = findUserById(senderId);
    if (!sender) {
    return res.status(404).json({ error: 'Sender not found' });
    }
    
    if (!room.members.includes(senderId)) {
    return res.status(403).json({ error: 'User is not a member of this room' });
    }
    
    const message = {
    id: generateId(),
    senderId,
    senderUsername: sender.username,
    roomId,
    roomName: room.name,
    content,
    timestamp: new Date().toISOString(),
    type: 'room'
    };
    
    messages.push(message);
    await saveMessages();
    
    // Emit message to room members
    io.emit('newRoomMessage', message);
    
    res.status(201).json({
    message: 'Message sent to room',
    data: message
    });
} catch (error) {
    console.error('Send room message error:', error);
    res.status(500).json({ error: 'Internal server error' });
}
});

// Get messages from a room
app.get('/api/rooms/:roomId/messages', (req, res) => {
const { roomId } = req.params;

const room = rooms.find(r => r.id === roomId);
if (!room) {
    return res.status(404).json({ error: 'Room not found' });
}

const roomMessages = messages.filter(msg => 
    msg.type === 'room' && msg.roomId === roomId
).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

res.json(roomMessages);
});

// ===== SOCKET.IO HANDLERS =====
const connectedUsers = new Map();

io.on('connection', (socket) => {
console.log('User connected:', socket.id);

// Handle user joining
socket.on('userJoin', (userData) => {
    socket.userId = userData.userId;
    socket.username = userData.username;
    connectedUsers.set(userData.userId, socket.id);
    
    console.log(`User ${userData.username} joined with socket ${socket.id}`);
    
    // Notify others
    socket.broadcast.emit('userOnline', userData);
});

// Handle joining rooms
socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.username} joined room ${roomId}`);
});

// Handle leaving rooms
socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.username} left room ${roomId}`);
});

// Handle typing indicators
socket.on('typing', (data) => {
    if (data.roomId) {
    socket.to(data.roomId).emit('userTyping', {
        userId: socket.userId,
        username: socket.username,
        roomId: data.roomId
    });
    } else if (data.receiverId) {
    const receiverSocketId = connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit('userTyping', {
        userId: socket.userId,
        username: socket.username
        });
    }
    }
});

socket.on('stopTyping', (data) => {
    if (data.roomId) {
    socket.to(data.roomId).emit('userStoppedTyping', {
        userId: socket.userId,
        username: socket.username,
        roomId: data.roomId
    });
    } else if (data.receiverId) {
    const receiverSocketId = connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit('userStoppedTyping', {
        userId: socket.userId,
        username: socket.username
        });
    }
    }
});

// Handle disconnect
socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.userId) {
    connectedUsers.delete(socket.userId);
    
    // Notify others
    socket.broadcast.emit('userOffline', {
        userId: socket.userId,
        username: socket.username
    });
    }
});
});

// ===== BASIC ROUTES =====
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

const connectedUsers = new Map();

const setupSocketHandlers = (io) => {
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
};

module.exports = { setupSocketHandlers };
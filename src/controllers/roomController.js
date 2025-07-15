const { getRooms, saveRooms, getMessages, saveMessages } = require('../utils/storage');
const { generateId, findUserById } = require('../utils/helpers');

const createRoom = async (req, res) => {
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
    
    const rooms = getRooms();
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
};

const getAllRooms = (req, res) => {
  const rooms = getRooms();
  res.json(rooms);
};

const getRoomById = (req, res) => {
  const { id } = req.params;
  const rooms = getRooms();
  const room = rooms.find(r => r.id === id);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json(room);
};

const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const rooms = getRooms();
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
    const io = req.app.get('io');
    io.emit('userJoinedRoom', { roomId, userId, username: user.username });
    
    res.json({ message: 'Successfully joined room' });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const sendRoomMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { senderId, content } = req.body;
    
    if (!senderId || !content) {
      return res.status(400).json({ error: 'Sender ID and content are required' });
    }
    
    const rooms = getRooms();
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
    
    const messages = getMessages();
    messages.push(message);
    await saveMessages();
    
    // Emit message to room members
    const io = req.app.get('io');
    io.emit('newRoomMessage', message);
    
    res.status(201).json({
      message: 'Message sent to room',
      data: message
    });
  } catch (error) {
    console.error('Send room message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getRoomMessages = (req, res) => {
  const { roomId } = req.params;
  const rooms = getRooms();
  const messages = getMessages();

  const room = rooms.find(r => r.id === roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const roomMessages = messages.filter(msg => 
    msg.type === 'room' && msg.roomId === roomId
  ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  res.json(roomMessages);
};

module.exports = {
  createRoom,
  getAllRooms,
  getRoomById,
  joinRoom,
  sendRoomMessage,
  getRoomMessages
};

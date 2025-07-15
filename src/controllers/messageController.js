const { getMessages, saveMessages } = require('../utils/storage');
const { generateId, findUserById } = require('../utils/helpers');

const sendDirectMessage = async (req, res) => {
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
    
    const messages = getMessages();
    messages.push(message);
    await saveMessages();
    
    // Emit message to connected clients
    const io = req.app.get('io');
    io.emit('newMessage', message);
    
    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getDirectMessages = (req, res) => {
  const { userId1, userId2 } = req.params;
  const messages = getMessages();

  const directMessages = messages.filter(msg => 
    msg.type === 'direct' && (
      (msg.senderId === userId1 && msg.receiverId === userId2) ||
      (msg.senderId === userId2 && msg.receiverId === userId1)
    )
  ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  res.json(directMessages);
};

const getUserMessages = (req, res) => {
  const { userId } = req.params;
  const messages = getMessages();

  const userMessages = messages.filter(msg => 
    msg.senderId === userId || msg.receiverId === userId
  ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  res.json(userMessages);
};

module.exports = {
  sendDirectMessage,
  getDirectMessages,
  getUserMessages
};

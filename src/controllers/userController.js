const { getUsers, saveUsers } = require('../utils/storage');
const { generateId, findUserById, findUserByUsername } = require('../utils/helpers');

const createUser = async (req, res) => {
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
    
    const users = getUsers();
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
};

const getAllUsers = (req, res) => {
  const users = getUsers();
  res.json(users);
};

const getUserById = (req, res) => {
  const { id } = req.params;
  const user = findUserById(id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
};

const updateUserStatus = async (req, res) => {
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
    const io = req.app.get('io');
    io.emit('userStatusChanged', { userId: id, isOnline });
    
    res.json({ message: 'Status updated successfully', user });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUserStatus
};

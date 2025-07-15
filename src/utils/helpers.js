const { getUsers } = require('./storage');

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const findUserById = (id) => {
  const users = getUsers();
  return users.find(user => user.id === id);
};

const findUserByUsername = (username) => {
  const users = getUsers();
  return users.find(user => user.username === username);
};

module.exports = {
  generateId,
  findUserById,
  findUserByUsername
};

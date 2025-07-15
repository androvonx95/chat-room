const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = './src/data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json');

let users = [];
let messages = [];
let rooms = [];

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

const saveUsers = async () => {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
};

const saveMessages = async () => {
  await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
};

const saveRooms = async () => {
  await fs.writeFile(ROOMS_FILE, JSON.stringify(rooms, null, 2));
};

// Getters
const getUsers = () => users;
const getMessages = () => messages;
const getRooms = () => rooms;

module.exports = {
  initializeStorage,
  saveUsers,
  saveMessages,
  saveRooms,
  getUsers,
  getMessages,
  getRooms
};

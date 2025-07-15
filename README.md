# Simple Chatroom Application

A real-time chatroom application built with Node.js, Express, and Socket.IO. This application allows users to create rooms, join rooms, and chat in real-time.

## Features

- Real-time messaging using Socket.IO
- Room creation and management
- User authentication and management
- RESTful API endpoints
- Prisma ORM integration
 
## Tech Stack

- **Backend**: Node.js with Express.js
- **Real-time Communication**: Socket.IO
- **Database**: Prisma ORM 
- **Development Tools**: Nodemon


## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=3000
   NODE_ENV=development
   ```

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The server will start on `http://localhost:3000`

## API Endpoints

### User Routes
- POST `/api/users` - Create new user
- GET `/api/users` - Get all users
- GET `/api/users/:id` - Get user by ID

### Room Routes
- POST `/api/rooms` - Create new room
- GET `/api/rooms` - Get all rooms
- GET `/api/rooms/:id` - Get room by ID
- POST `/api/rooms/:roomId/join` - Join a room

### Message Routes
- POST `/api/rooms/:roomId/messages` - Send message to room
- GET `/api/rooms/:roomId/messages` - Get room messages

## Real-time Features

The application uses Socket.IO for real-time communication:
- Users receive messages instantly when they're sent
- Room events (join/leave) are broadcasted in real-time
- Presence detection (planned feature)

## Development

The project is set up for development with:
- Nodemon for automatic restarts during development
- Local storage for development (PostgreSQL integration planned)
- RESTful API endpoints with Socket.IO integration

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

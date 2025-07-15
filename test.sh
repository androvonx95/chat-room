#!/bin/bash

echo "🚀 Testing Chatroom Server"
echo "=========================="

# Function to extract ID from JSON response
extract_id() {
    echo "$1" | jq -r '.user.id'
}

# Function to extract room ID from JSON response
extract_room_id() {
    echo "$1" | jq -r '.room.id'
}

# 1. Create users
echo "📝 Creating users..."
USER1=$(curl -s -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"username": "alice"}' | extract_id)
USER2=$(curl -s -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"username": "bob"}' | extract_id)
USER3=$(curl -s -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"username": "charlie"}' | extract_id)

echo "✅ Created users: Alice($USER1), Bob($USER2), Charlie($USER3)"

# 2. Test direct messages
echo "💬 Testing direct messages..."
curl -s -X POST http://localhost:3000/api/messages/direct \
  -H "Content-Type: application/json" \
  -d "{"senderId": "$USER1", "receiverId": "$USER2", "content": "Hey Bob!"}" > /dev/null
curl -s -X POST http://localhost:3000/api/messages/direct \
  -H "Content-Type: application/json" \
  -d "{"senderId": "$USER2", "receiverId": "$USER1", "content": "Hi Alice!"}" > /dev/null
echo "✅ Direct messages sent"

# 3. Create and join room
echo "🏠 Testing rooms..."
ROOM_ID=$(curl -s -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d "{"name": "Test Room", "creatorId": "$USER1"}" | extract_room_id)

curl -s -X POST http://localhost:3000/api/rooms/$ROOM_ID/join \
  -H "Content-Type: application/json" \
  -d "{"userId": "$USER2"}" > /dev/null
curl -s -X POST http://localhost:3000/api/rooms/$ROOM_ID/join \
  -H "Content-Type: application/json" \
  -d "{"userId": "$USER3"}" > /dev/null
echo "✅ Room created and users joined: $ROOM_ID"

# 4. Send room messages
echo "📢 Testing room messages..."
curl -s -X POST http://localhost:3000/api/rooms/$ROOM_ID/messages \
  -H "Content-Type: application/json" \
  -d "{"senderId": "$USER1", "content": "Welcome to the test room!"}" > /dev/null
curl -s -X POST http://localhost:3000/api/rooms/$ROOM_ID/messages \
  -H "Content-Type: application/json" \
  -d "{"senderId": "$USER2", "content": "Thanks for creating this room!"}" > /dev/null
echo "✅ Room messages sent"

# 5. Get results
echo "📊 Results:"
echo "Users: $(curl -s http://localhost:3000/api/users | jq length) users created"
echo "Direct Messages: $(curl -s http://localhost:3000/api/messages/direct/$USER1/$USER2 | jq length) messages between Alice and Bob"
echo "Room Messages: $(curl -s http://localhost:3000/api/rooms/$ROOM_ID/messages | jq length) messages in the room"
echo "Rooms: $(curl -s http://localhost:3000/api/rooms | jq length) rooms created"

# 6. Test user status update
echo "🔄 Testing user status update..."
curl -s -X PATCH http://localhost:3000/api/users/$USER1/status \
  -H "Content-Type: application/json" \
  -d "{"isOnline": false}" > /dev/null
echo "✅ Updated user status"

# 7. Test specific user info
echo "🔍 Testing user info..."
curl -s http://localhost:3000/api/users/$USER1 | jq .
echo "✅ Retrieved user info"

# 8. Test specific room info
echo "🔍 Testing room info..."
curl -s http://localhost:3000/api/rooms/$ROOM_ID | jq .
echo "✅ Retrieved room info"

echo "🎉 All tests completed successfully!"
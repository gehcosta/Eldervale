const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static(path.join(__dirname)));

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('createRoom', (data, callback) => {
    const roomId = generateRoomId();
    socket.join(roomId);
    socket.playerName = data.name;
    socket.roomId = roomId;
    socket.isHost = true;
    callback({ success: true, roomId });
    console.log(`Room created: ${roomId} by ${data.name}`);
  });

  socket.on('joinRoom', (data, callback) => {
    const room = io.sockets.adapter.rooms.get(data.roomId);
    if (room) {
      socket.join(data.roomId);
      socket.playerName = data.name;
      socket.roomId = data.roomId;
      socket.isHost = false;
      
      socket.to(data.roomId).emit('playerJoined', { id: socket.id, name: data.name });
      
      callback({ success: true });
      console.log(`${data.name} joined room: ${data.roomId}`);
    } else {
      callback({ success: false, message: "Sessão não encontrada" });
    }
  });

  socket.on('update', (state) => {
    if (socket.roomId) {
      state.id = socket.id;
      socket.to(socket.roomId).emit('playerUpdate', state);
    }
  });

  socket.on('playerSkill', (data) => {
    if (socket.roomId) {
      data.id = socket.id;
      socket.to(socket.roomId).emit('playerSkill', data);
    }
  });

  socket.on('playerChat', (data) => {
    if (socket.roomId) {
      data.id = socket.id;
      data.name = socket.playerName;
      socket.to(socket.roomId).emit('playerChat', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.roomId) {
      socket.to(socket.roomId).emit('playerLeft', { id: socket.id, name: socket.playerName });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

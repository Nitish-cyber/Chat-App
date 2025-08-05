// server.js
const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');

const app = express();

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname)); // Serve from current directory

// Serve HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const server = app.listen(3000, () => {
  console.log("✅ Server started on http://localhost:3000");
});

// Create Socket.IO instance
const io = socketIO(server);

// ✅ Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/chatdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ Define a Message schema
const messageSchema = new mongoose.Schema({
  name: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// ✅ Track connected users
let userCount = 0;

io.on('connection', (socket) => {
  userCount++;
  io.emit('user count', userCount);

  socket.on('disconnect', () => {
    userCount--;
    io.emit('user count', userCount);
  });

  socket.on('chat message', async (data) => {
    const newMsg = new Message({
      name: data.name,
      message: data.message
    });

    try {
      await newMsg.save();
      console.log(`💾 Saved: ${data.name} — ${data.message}`);
    } catch (err) {
      console.error("❌ Error saving message:", err);
    }

    io.emit('chat message', data);
    io.emit('typing', '');
  });

  socket.on('typing', (msg) => {
    socket.broadcast.emit('typing', msg);
  });
});

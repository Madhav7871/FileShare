const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));

const server = http.createServer(app);

// UPDATED: Added maxHttpBufferSize to allow large file transfers
const io = new Server(server, {
  maxHttpBufferSize: 1e8, // 100 MB limit
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const rooms = new Map();
const codeRooms = new Map();

io.on("connection", (socket) => {
  console.log(`✅ User Connected: ${socket.id}`);

  socket.on("create_room", (data) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms.set(code, data.files);
    socket.join(code);
    socket.emit("room_created", code);
    console.log(`📂 Room Created: ${code}`);
  });

  socket.on("join_room", (code) => {
    const files = rooms.get(code);
    if (files) {
      socket.join(code);
      socket.emit("file_received", { files });
      console.log(`📥 User joined room: ${code}`);
    } else {
      socket.emit("error", "Invalid Key");
    }
  });

  socket.on("join_code_session", (roomCode) => {
    socket.join(roomCode);
    const existingCode = codeRooms.get(roomCode) || "// Start coding...";
    socket.emit("code_update", existingCode);
    console.log(`👨‍💻 User joined Code Room: ${roomCode}`);
  });

  socket.on("send_code_update", ({ roomCode, code }) => {
    codeRooms.set(roomCode, code);
    socket.to(roomCode).emit("code_update", code);
  });

  socket.on("disconnect", () => {
    console.log(`❌ User Disconnected: ${socket.id}`);
  });
});

server.listen(5000, () => {
  console.log("🚀 SERVER RUNNING ON PORT 5000");
});

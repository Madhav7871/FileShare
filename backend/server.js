const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

// Allow Express to accept requests from any origin (like Vercel)
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

const server = http.createServer(app);

// Dynamic port binding for Render
const PORT = process.env.PORT || 5000;

const io = new Server(server, {
  maxHttpBufferSize: 1e8, // 100 MB limit
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const rooms = new Map(); // For File Sharing
const codeRooms = new Map(); // For storing the actual code text
const activeCodeRooms = new Set(); // To track which code rooms actually exist

io.on("connection", (socket) => {
  console.log(`✅ User Connected: ${socket.id}`);

  // ==========================================
  // FILE SHARE LOGIC
  // ==========================================
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
      // Emits an error if the file key is wrong
      socket.emit("error", "Invalid Key! No files found for this code.");
    }
  });

  // ==========================================
  // CODE ROOM LOGIC
  // ==========================================

  // 1. CREATE A NEW CODE ROOM
  socket.on("create_code_session", (roomId) => {
    if (activeCodeRooms.has(roomId)) {
      socket.emit(
        "error",
        "This room code already exists. Please generate a new one.",
      );
      return;
    }

    activeCodeRooms.add(roomId);
    codeRooms.set(roomId, "// Start coding...\n");

    socket.join(roomId);
    socket.emit("code_session_created", roomId);
    console.log(`👨‍💻 Code Room Created: ${roomId}`);
  });

  // 2. JOIN AN EXISTING CODE ROOM
  socket.on("join_code_session", (roomCode) => {
    if (!activeCodeRooms.has(roomCode)) {
      // Emits an error if the code room doesn't exist
      socket.emit(
        "error",
        "Invalid Room ID! This room has not been created yet.",
      );
      return;
    }

    socket.join(roomCode);
    socket.emit("code_session_joined");

    const existingCode = codeRooms.get(roomCode) || "// Start coding...\n";
    socket.emit("code_update", existingCode);
    console.log(`📥 User joined Code Room: ${roomCode}`);
  });

  // 3. LEAVE A CODE ROOM (Fixes the Ghost Typing Bug)
  socket.on("leave_code_session", (roomCode) => {
    socket.leave(roomCode);
    console.log(`🚪 User left Code Room: ${roomCode}`);
  });

  // 4. REAL-TIME TYPING
  socket.on("send_code_update", ({ roomCode, code }) => {
    if (activeCodeRooms.has(roomCode)) {
      codeRooms.set(roomCode, code);
      socket.to(roomCode).emit("code_update", code);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ User Disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
});

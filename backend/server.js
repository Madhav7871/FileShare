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

// ==========================================
// [NEW] GPS RADAR STATE & MATH LOGIC
// ==========================================
const activeUsers = new Map(); // To store user socket IDs and their GPS coordinates

// Helper function to calculate distance in meters between two coordinates
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

const RADIUS_IN_METERS = 100; // Users must be within 100m to see each other

// Helper to recalculate and send a user's radar list
function updateRadarForUser(targetSocketId, targetUserCoords) {
  const nearbyUsers = [];

  activeUsers.forEach((user, id) => {
    if (id !== targetSocketId) {
      const distance = getDistanceInMeters(
        targetUserCoords.lat,
        targetUserCoords.lng,
        user.lat,
        user.lng,
      );

      if (distance <= RADIUS_IN_METERS) {
        nearbyUsers.push({
          socketId: user.socketId,
          deviceName: user.deviceName,
        });
      }
    }
  });

  io.to(targetSocketId).emit("nearby_devices", nearbyUsers);
}

io.on("connection", (socket) => {
  console.log(`✅ User Connected: ${socket.id}`);

  // Assign a default device name
  socket.deviceName = `Device-${socket.id.substring(0, 4).toUpperCase()}`;

  // ==========================================
  // [NEW] HANDLE CUSTOM USER NAMES
  // ==========================================
  socket.on("set_name", (customName) => {
    // Clean up the name and make sure it's not empty
    const cleanName = customName ? customName.trim().substring(0, 20) : null;

    if (cleanName) {
      socket.deviceName = cleanName;
      console.log(`👤 User renamed to: ${socket.deviceName}`);

      // If they are already on the GPS radar, update their name in the activeUsers list
      if (activeUsers.has(socket.id)) {
        const user = activeUsers.get(socket.id);
        user.deviceName = cleanName;
        activeUsers.set(socket.id, user);

        // Re-broadcast the updated name to everyone nearby so it changes instantly!
        activeUsers.forEach((otherUser, otherId) => {
          if (otherId !== socket.id) {
            const distance = getDistanceInMeters(
              user.lat,
              user.lng,
              otherUser.lat,
              otherUser.lng,
            );
            if (distance <= RADIUS_IN_METERS) {
              updateRadarForUser(otherId, otherUser);
            }
          }
        });
      }
    }
  });

  // ==========================================
  // [UPDATED] GPS RADAR CONNECTION LOGIC
  // ==========================================

  // Listen for the frontend sending GPS coordinates
  socket.on("update_location", (coords) => {
    console.log(`📍 Location received from ${socket.deviceName}:`, coords);

    // 1. Store this user's location
    activeUsers.set(socket.id, {
      socketId: socket.id,
      deviceName: socket.deviceName,
      lat: coords.lat,
      lng: coords.lng,
    });

    // 2. Send THIS user their list of nearby devices
    updateRadarForUser(socket.id, coords);

    // 3. Update the radar for anyone else who is already nearby
    activeUsers.forEach((user, otherSocketId) => {
      if (otherSocketId !== socket.id) {
        const distance = getDistanceInMeters(
          coords.lat,
          coords.lng,
          user.lat,
          user.lng,
        );
        if (distance <= RADIUS_IN_METERS) {
          updateRadarForUser(otherSocketId, user);
        }
      }
    });
  });

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
      socket.emit("error", "Invalid Key! No files found for this code.");
    }
  });

  // ==========================================
  // CODE ROOM LOGIC
  // ==========================================
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

  socket.on("join_code_session", (roomCode) => {
    if (!activeCodeRooms.has(roomCode)) {
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

  socket.on("leave_code_session", (roomCode) => {
    socket.leave(roomCode);
    console.log(`🚪 User left Code Room: ${roomCode}`);
  });

  socket.on("send_code_update", ({ roomCode, code }) => {
    if (activeCodeRooms.has(roomCode)) {
      codeRooms.set(roomCode, code);
      socket.to(roomCode).emit("code_update", code);
    }
  });

  // ==========================================
  // DISCONNECT LOGIC
  // ==========================================
  socket.on("disconnect", () => {
    console.log(`❌ User Disconnected: ${socket.id}`);

    // If the user was on the radar, remove them and update their neighbors
    if (activeUsers.has(socket.id)) {
      const departedUser = activeUsers.get(socket.id);
      activeUsers.delete(socket.id);

      // Find everyone who WAS near this user and update their lists
      activeUsers.forEach((user, otherSocketId) => {
        const distance = getDistanceInMeters(
          departedUser.lat,
          departedUser.lng,
          user.lat,
          user.lng,
        );
        if (distance <= RADIUS_IN_METERS) {
          updateRadarForUser(otherSocketId, user);
        }
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
});

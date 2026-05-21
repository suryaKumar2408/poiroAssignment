const { Server } = require("socket.io")

let io = null

/**
 * Initialize Socket.IO — call once from server.js after creating http.Server.
 */
function initSocket(httpServer) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:5173", "http://localhost:3000"]

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  })

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`)

    // Frontend calls socket.emit("join-room", roomCode) right after connecting
    socket.on("join-room", (roomCode) => {
      if (!roomCode) return
      socket.join(roomCode)
      console.log(`[Socket] ${socket.id} joined room channel: ${roomCode}`)
    })

    socket.on("leave-room", (roomCode) => {
      if (!roomCode) return
      socket.leave(roomCode)
    })

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`)
    })
  })

  console.log("[Socket] Socket.IO initialized")
  return io
}

/**
 * Get the active Socket.IO instance.
 * Used in controllers and the BullMQ worker to emit events.
 */
function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initSocket(httpServer) first.")
  }
  return io
}

module.exports = { initSocket, getIO }

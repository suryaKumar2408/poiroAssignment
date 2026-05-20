import { io } from 'socket.io-client'

let socket = null

/**
 * Get or create the Socket.IO singleton.
 * Uses Vite's proxy so no hardcoded port needed.
 */
export function getSocket() {
  if (!socket) {
    socket = io('/', {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}

/**
 * Connect to Socket.IO and join a room channel.
 * Call this when entering the battle room.
 */
export function connectToRoom(roomCode) {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
  }
  // Join the room's socket channel
  s.emit('join-room', roomCode)
  return s
}

/**
 * Disconnect and clean up the socket.
 * Call this when leaving the battle room.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

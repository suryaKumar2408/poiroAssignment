require("dotenv").config()

const http = require("http")
const app = require("./src/app")
const connectToDB = require("./src/config/database")
const { initSocket } = require("./src/socket/socket")

async function start() {
  // 1. Connect to MongoDB
  await connectToDB()

  // 2. Wrap Express in an HTTP server (required for Socket.IO)
  const httpServer = http.createServer(app)

  // 3. Attach Socket.IO to the HTTP server
  initSocket(httpServer)

  // 4. Boot the BullMQ AI worker (Socket.IO must be ready first so it can emit events)
  require("./src/queue/worker")

  // 5. Start listening
  const PORT = process.env.PORT || 4000
  httpServer.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`)
    console.log(`[Server] Health → http://localhost:${PORT}/api/health`)
  })
}

start().catch((err) => {
  console.error("[Server] Fatal startup error:", err)
  process.exit(1)
})

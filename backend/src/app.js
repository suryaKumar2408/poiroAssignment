const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
)

// ─── Auth ──────────────────────────────────────────────────────────────────────
const authRouter = require("./routes/auth.routes")
app.use("/api/auth", authRouter)

// ─── Room System ───────────────────────────────────────────────────────────────
const roomRouter = require("./routes/room.routes")
const roundRouter = require("./routes/round.routes")
const submissionRouter = require("./routes/submission.routes")
const scoreRouter = require("./routes/score.routes")

app.use("/api/rooms", roomRouter)
app.use("/api/rounds", roundRouter)
app.use("/api/submissions", submissionRouter)
app.use("/api/scores", scoreRouter)

// ─── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})

module.exports = app

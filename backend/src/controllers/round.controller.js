const roomModel = require("../models/room.model")
const roundModel = require("../models/round.model")
const { getIO } = require("../socket/socket")

/**
 * POST /api/rounds/start
 * Body: { roomCode }
 * Only the host can start a round. Validates on the server side.
 */
async function startRound(req, res) {
  try {
    const { roomCode } = req.body

    if (!roomCode) {
      return res.status(400).json({ message: "roomCode is required" })
    }

    const room = await roomModel.findOne({ code: roomCode.toUpperCase() })

    if (!room) {
      return res.status(404).json({ message: "Room not found" })
    }

    // ── Server-side host validation ──────────────────────────────────────────
    if (room.host.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Only the host can start a round" })
    }

    if (room.status === "completed") {
      return res.status(400).json({ message: "This room has ended" })
    }

    // Auto-increment round number
    const existingCount = await roundModel.countDocuments({ room: room._id })

    const round = await roundModel.create({
      room: room._id,
      roundNumber: existingCount + 1,
      status: "active",
      startedAt: new Date(),
    })

    // Mark room as active
    await roomModel.findByIdAndUpdate(room._id, { status: "active" })

    // Broadcast to all room participants
    try {
      getIO().to(room.code).emit("round:started", {
        round: {
          id: round._id,
          roundNumber: round.roundNumber,
          status: round.status,
          startedAt: round.startedAt,
          roomCode: room.code,
        },
      })
    } catch (socketErr) {
      console.warn("[Round] Socket emit failed:", socketErr.message)
    }

    return res.status(201).json({
      message: `Round ${round.roundNumber} started`,
      round: {
        id: round._id,
        roundNumber: round.roundNumber,
        status: round.status,
        startedAt: round.startedAt,
        room: room._id,
      },
    })
  } catch (err) {
    console.error("[Round] startRound error:", err)
    return res.status(500).json({ message: "Failed to start round", error: err.message })
  }
}

/**
 * POST /api/rounds/end
 * Body: { roundId }
 * Only the host can end the current active round.
 */
async function endRound(req, res) {
  try {
    const { roundId } = req.body

    if (!roundId) {
      return res.status(400).json({ message: "roundId is required" })
    }

    const round = await roundModel.findById(roundId).populate("room")

    if (!round) {
      return res.status(404).json({ message: "Round not found" })
    }

    const room = round.room

    // ── Server-side host validation ──────────────────────────────────────────
    if (room.host.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Only the host can end a round" })
    }

    if (round.status === "completed") {
      return res.status(400).json({ message: "Round is already completed" })
    }

    round.status = "completed"
    round.endedAt = new Date()
    await round.save()

    try {
      getIO().to(room.code).emit("round:ended", {
        round: {
          id: round._id,
          roundNumber: round.roundNumber,
          status: round.status,
          endedAt: round.endedAt,
        },
      })
    } catch (socketErr) {
      console.warn("[Round] Socket emit failed:", socketErr.message)
    }

    return res.status(200).json({
      message: `Round ${round.roundNumber} ended`,
      round: {
        id: round._id,
        roundNumber: round.roundNumber,
        status: round.status,
        endedAt: round.endedAt,
      },
    })
  } catch (err) {
    console.error("[Round] endRound error:", err)
    return res.status(500).json({ message: "Failed to end round", error: err.message })
  }
}

/**
 * GET /api/rounds/:roomCode
 * All rounds for a room, sorted by round number.
 */
async function getRoundsByRoom(req, res) {
  try {
    const { roomCode } = req.params

    const room = await roomModel.findOne({ code: roomCode.toUpperCase() })
    if (!room) return res.status(404).json({ message: "Room not found" })

    const rounds = await roundModel.find({ room: room._id }).sort({ roundNumber: 1 })

    return res.status(200).json({ rounds })
  } catch (err) {
    console.error("[Round] getRoundsByRoom error:", err)
    return res.status(500).json({ message: "Failed to get rounds", error: err.message })
  }
}

module.exports = { startRound, endRound, getRoundsByRoom }

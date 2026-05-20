const crypto = require("crypto")
const roomModel = require("../models/room.model")
const roundModel = require("../models/round.model")
const submissionModel = require("../models/submission.model")
const scoreModel = require("../models/score.model")
const { getIO } = require("../socket/socket")

/** Generate a unique 6-character alphanumeric room code (uppercase) */
function generateRoomCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase()
}

/**
 * POST /api/rooms/create
 * Creates a new room. The authenticated user becomes the host.
 */
async function createRoom(req, res) {
  try {
    let code
    let isUnique = false

    while (!isUnique) {
      code = generateRoomCode()
      const existing = await roomModel.findOne({ code })
      if (!existing) isUnique = true
    }

    const room = await roomModel.create({
      code,
      host: req.user.id,
      status: "waiting",
      participants: [req.user.id],
    })

    return res.status(201).json({
      message: "Room created successfully",
      room: {
        id: room._id,
        code: room.code,
        status: room.status,
        host: req.user.id,
      },
    })
  } catch (err) {
    console.error("[Room] createRoom error:", err)
    return res.status(500).json({ message: "Failed to create room", error: err.message })
  }
}

/**
 * POST /api/rooms/join
 * Body: { code }
 * Adds the authenticated user as a participant and emits participant:joined.
 */
async function joinRoom(req, res) {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({ message: "Room code is required" })
    }

    const room = await roomModel.findOne({ code: code.toUpperCase() })

    if (!room) {
      return res.status(404).json({ message: "Room not found. Check the code and try again." })
    }

    if (room.status === "completed") {
      return res.status(400).json({ message: "This room has already ended." })
    }

    // Prevent duplicate participants
    const alreadyJoined = room.participants.some(
      (p) => p.toString() === req.user.id.toString()
    )

    if (!alreadyJoined) {
      room.participants.push(req.user.id)
      await room.save()
    }

    const populatedRoom = await roomModel
      .findById(room._id)
      .populate("participants", "username email")
      .populate("host", "username email")

    // Emit real-time event to everyone already in the room channel
    try {
      getIO().to(room.code).emit("participant:joined", {
        user: { id: req.user.id, username: req.user.username },
        participants: populatedRoom.participants,
        roomCode: room.code,
      })
    } catch (socketErr) {
      console.warn("[Room] Socket emit failed:", socketErr.message)
    }

    return res.status(200).json({
      message: "Joined room successfully",
      room: {
        id: populatedRoom._id,
        code: populatedRoom.code,
        status: populatedRoom.status,
        host: populatedRoom.host,
        participants: populatedRoom.participants,
      },
    })
  } catch (err) {
    console.error("[Room] joinRoom error:", err)
    return res.status(500).json({ message: "Failed to join room", error: err.message })
  }
}

/**
 * GET /api/rooms/:code
 * Basic room info by code.
 */
async function getRoomByCode(req, res) {
  try {
    const { code } = req.params

    const room = await roomModel
      .findOne({ code: code.toUpperCase() })
      .populate("host", "username email")
      .populate("participants", "username email")

    if (!room) {
      return res.status(404).json({ message: "Room not found" })
    }

    return res.status(200).json({ room })
  } catch (err) {
    console.error("[Room] getRoomByCode error:", err)
    return res.status(500).json({ message: "Failed to get room", error: err.message })
  }
}

/**
 * GET /api/rooms/:code/state
 * Full room state for page-refresh data recovery.
 * Returns: room + participants + rounds + submissions (with jobStatus) + scores
 */
async function getRoomState(req, res) {
  try {
    const { code } = req.params

    const room = await roomModel
      .findOne({ code: code.toUpperCase() })
      .populate("host", "username email")
      .populate("participants", "username email")

    if (!room) {
      return res.status(404).json({ message: "Room not found" })
    }

    const [rounds, submissions, scores] = await Promise.all([
      roundModel.find({ room: room._id }).sort({ roundNumber: 1 }),
      submissionModel
        .find({ room: room._id })
        .populate("user", "username email")
        .populate("round", "roundNumber status")
        .sort({ createdAt: 1 }),
      scoreModel
        .find({ room: room._id })
        .populate("user", "username email")
        .populate("submission")
        .populate("round", "roundNumber")
        .sort({ score: -1 }),
    ])

    return res.status(200).json({
      message: "Room state fetched successfully",
      room: {
        id: room._id,
        code: room.code,
        status: room.status,
        host: room.host,
        participants: room.participants,
        createdAt: room.createdAt,
      },
      rounds,
      submissions,
      scores,
    })
  } catch (err) {
    console.error("[Room] getRoomState error:", err)
    return res.status(500).json({ message: "Failed to get room state", error: err.message })
  }
}

module.exports = { createRoom, joinRoom, getRoomByCode, getRoomState }

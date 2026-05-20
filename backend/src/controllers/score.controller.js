const scoreModel = require("../models/score.model")
const submissionModel = require("../models/submission.model")
const roomModel = require("../models/room.model")
const { getIO } = require("../socket/socket")

/**
 * POST /api/scores
 * Body: { submissionId, score, eliminated? }
 * Only the host can score. Automatically recalculates ranks after each score.
 */
async function submitScore(req, res) {
  try {
    const { submissionId, score, eliminated = false } = req.body

    if (submissionId === undefined || score === undefined) {
      return res.status(400).json({ message: "submissionId and score are required" })
    }

    if (typeof score !== "number" || score < 0 || score > 100) {
      return res.status(400).json({ message: "Score must be a number between 0 and 100" })
    }

    const submission = await submissionModel
      .findById(submissionId)
      .populate("round")
      .populate("room")

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" })
    }

    const room = submission.room

    // ── Server-side host validation ──────────────────────────────────────────
    if (room.host.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Only the host can submit scores" })
    }

    // Upsert: update existing score or create a new one
    const existingScore = await scoreModel.findOne({ submission: submissionId })

    let savedScore
    if (existingScore) {
      existingScore.score = score
      existingScore.eliminated = eliminated
      existingScore.givenBy = req.user.id
      savedScore = await existingScore.save()
    } else {
      savedScore = await scoreModel.create({
        room: room._id,
        round: submission.round._id,
        submission: submission._id,
        user: submission.user,
        score,
        eliminated,
        givenBy: req.user.id,
      })
    }

    // ── Recalculate ranks for this round ─────────────────────────────────────
    const allScores = await scoreModel
      .find({ round: submission.round._id })
      .sort({ score: -1 })

    let rank = 1
    for (const s of allScores) {
      s.rank = s.eliminated ? null : rank++
      await s.save()
    }

    // Fetch updated leaderboard with populated data
    const leaderboard = await scoreModel
      .find({ round: submission.round._id })
      .populate("user", "username email")
      .populate("submission", "prompt aiOutput")
      .sort({ score: -1 })

    // Broadcast leaderboard update to the whole room
    try {
      getIO().to(room.code).emit("leaderboard:updated", {
        roundId: submission.round._id,
        roomCode: room.code,
        leaderboard,
      })
    } catch (socketErr) {
      console.warn("[Score] Socket emit failed:", socketErr.message)
    }

    return res.status(200).json({
      message: "Score submitted and leaderboard updated",
      score: savedScore,
      leaderboard,
    })
  } catch (err) {
    console.error("[Score] submitScore error:", err)
    return res.status(500).json({ message: "Failed to submit score", error: err.message })
  }
}

/**
 * GET /api/scores/:roomCode
 * Full leaderboard for a room (all rounds combined).
 */
async function getLeaderboard(req, res) {
  try {
    const { roomCode } = req.params

    const room = await roomModel.findOne({ code: roomCode.toUpperCase() })

    if (!room) {
      return res.status(404).json({ message: "Room not found" })
    }

    const scores = await scoreModel
      .find({ room: room._id })
      .populate("user", "username email")
      .populate("submission", "prompt aiOutput")
      .populate("round", "roundNumber")
      .sort({ score: -1 })

    return res.status(200).json({
      message: "Leaderboard fetched",
      leaderboard: scores,
    })
  } catch (err) {
    console.error("[Score] getLeaderboard error:", err)
    return res.status(500).json({ message: "Failed to fetch leaderboard", error: err.message })
  }
}

/**
 * GET /api/scores/round/:roundId
 * Leaderboard for a specific round, sorted by rank.
 */
async function getRoundLeaderboard(req, res) {
  try {
    const { roundId } = req.params

    const scores = await scoreModel
      .find({ round: roundId })
      .populate("user", "username email")
      .populate("submission", "prompt aiOutput")
      .sort({ rank: 1, score: -1 })

    return res.status(200).json({
      message: "Round leaderboard fetched",
      leaderboard: scores,
    })
  } catch (err) {
    console.error("[Score] getRoundLeaderboard error:", err)
    return res.status(500).json({ message: "Failed to fetch round leaderboard", error: err.message })
  }
}

module.exports = { submitScore, getLeaderboard, getRoundLeaderboard }

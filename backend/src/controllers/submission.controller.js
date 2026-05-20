const submissionModel = require("../models/submission.model")
const roundModel = require("../models/round.model")
const { aiQueue } = require("../queue/queue")
const { getIO } = require("../socket/socket")

/**
 * POST /api/submissions
 * Body: { roundId, prompt }
 * Creates a submission record and enqueues an AI processing job immediately.
 */
async function createSubmission(req, res) {
  try {
    const { roundId, prompt } = req.body

    if (!roundId || !prompt) {
      return res.status(400).json({ message: "roundId and prompt are required" })
    }

    if (prompt.trim().length === 0) {
      return res.status(400).json({ message: "Prompt cannot be empty" })
    }

    const round = await roundModel.findById(roundId).populate("room")

    if (!round) {
      return res.status(404).json({ message: "Round not found" })
    }

    if (round.status !== "active") {
      return res.status(400).json({ message: "This round is not currently active" })
    }

    const room = round.room

    // Verify user is a participant in this room
    const isParticipant = room.participants.some(
      (p) => p.toString() === req.user.id.toString()
    )
    if (!isParticipant) {
      return res.status(403).json({ message: "You are not a participant in this room" })
    }

    // Create submission record (jobStatus defaults to "queued")
    const submission = await submissionModel.create({
      round: round._id,
      room: room._id,
      user: req.user.id,
      prompt: prompt.trim(),
      jobStatus: "queued",
    })

    // Push job to BullMQ — non-blocking, worker handles it in background
    const job = await aiQueue.add("process-submission", {
      submissionId: submission._id.toString(),
      prompt: prompt.trim(),
      roomCode: room.code,
    })

    // Store the BullMQ job ID on the submission for traceability
    await submissionModel.findByIdAndUpdate(submission._id, { jobId: job.id })

    // Emit queued event so clients see real-time feedback instantly
    try {
      getIO().to(room.code).emit("submission:queued", {
        submissionId: submission._id,
        jobId: job.id,
        jobStatus: "queued",
        user: { id: req.user.id, username: req.user.username },
        roundId: round._id,
        prompt: prompt.trim(),
      })
    } catch (socketErr) {
      console.warn("[Submission] Socket emit failed:", socketErr.message)
    }

    return res.status(201).json({
      message: "Submission received and queued for AI processing",
      submission: {
        id: submission._id,
        jobId: job.id,
        jobStatus: "queued",
        prompt: submission.prompt,
        round: round._id,
        room: room._id,
      },
    })
  } catch (err) {
    console.error("[Submission] createSubmission error:", err)
    return res.status(500).json({ message: "Failed to create submission", error: err.message })
  }
}

/**
 * GET /api/submissions/:roundId
 * All submissions for a specific round.
 */
async function getSubmissions(req, res) {
  try {
    const { roundId } = req.params

    const submissions = await submissionModel
      .find({ round: roundId })
      .populate("user", "username email")
      .sort({ createdAt: 1 })

    return res.status(200).json({
      message: "Submissions fetched",
      submissions,
    })
  } catch (err) {
    console.error("[Submission] getSubmissions error:", err)
    return res.status(500).json({ message: "Failed to fetch submissions", error: err.message })
  }
}

/**
 * GET /api/submissions/single/:submissionId
 * Single submission by ID — useful as a polling fallback if socket disconnects.
 */
async function getSubmissionById(req, res) {
  try {
    const { submissionId } = req.params

    const submission = await submissionModel
      .findById(submissionId)
      .populate("user", "username email")

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" })
    }

    return res.status(200).json({ submission })
  } catch (err) {
    console.error("[Submission] getSubmissionById error:", err)
    return res.status(500).json({ message: "Failed to fetch submission", error: err.message })
  }
}

module.exports = { createSubmission, getSubmissions, getSubmissionById }

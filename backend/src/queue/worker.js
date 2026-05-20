const { Worker } = require("bullmq")
const { redisConnection } = require("./queue")
const submissionModel = require("../models/submission.model")
const { getIO } = require("../socket/socket")

// OpenRouter is OpenAI-API-compatible — point the openai SDK at it
const OpenAI = require("openai")

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://poiro-assignment.vercel.app",
    "X-Title": "PoiroAssignment",
  },
})

/**
 * Safely emit a socket event to a room channel.
 * Won't crash if Socket.IO isn't ready (e.g. in tests).
 */
function emitToRoom(roomCode, event, payload) {
  try {
    getIO().to(roomCode).emit(event, payload)
  } catch (err) {
    console.warn(`[Worker] Socket emit failed (${event}):`, err.message)
  }
}

const aiWorker = new Worker(
  "ai-jobs",
  async (job) => {
    const { submissionId, prompt, roomCode } = job.data

    console.log(`[Worker] Processing job ${job.id} | submission: ${submissionId}`)

    // ── Step 1: Mark as running ───────────────────────────────────────────────
    await submissionModel.findByIdAndUpdate(submissionId, { jobStatus: "running" })
    emitToRoom(roomCode, "submission:processing", {
      submissionId,
      jobStatus: "running",
    })

    // ── Step 2: Call OpenRouter AI ────────────────────────────────────────────
    const model = process.env.AI_MODEL || "openai/gpt-4o-mini"

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant in a competitive real-time game. Evaluate or respond to the participant's prompt clearly and concisely.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1024,
    })

    const aiOutput = completion.choices[0]?.message?.content?.trim() || ""

    // ── Step 3: Save result & mark completed ──────────────────────────────────
    await submissionModel.findByIdAndUpdate(submissionId, {
      jobStatus: "completed",
      aiOutput,
      errorMessage: null,
    })

    emitToRoom(roomCode, "submission:completed", {
      submissionId,
      jobStatus: "completed",
      aiOutput,
    })

    console.log(`[Worker] Job ${job.id} completed`)
    return { submissionId, aiOutput }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
)

// ── Permanent failure handler (after all retries exhausted) ───────────────────
aiWorker.on("failed", async (job, err) => {
  console.error(`[Worker] Job ${job?.id} permanently failed:`, err.message)

  if (job?.data?.submissionId) {
    const { submissionId, roomCode } = job.data

    await submissionModel
      .findByIdAndUpdate(submissionId, {
        jobStatus: "failed",
        errorMessage: err.message,
      })
      .catch(() => {})

    emitToRoom(roomCode, "submission:failed", {
      submissionId,
      jobStatus: "failed",
      error: err.message,
    })
  }
})

aiWorker.on("error", (err) => {
  console.error("[Worker] BullMQ internal error:", err.message)
})

console.log("[Worker] AI job worker listening on queue: ai-jobs")

module.exports = { aiWorker }

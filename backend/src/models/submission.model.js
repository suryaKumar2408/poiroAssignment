const mongoose = require("mongoose")

const submissionSchema = new mongoose.Schema(
  {
    round: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "round",
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "room",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    aiOutput: {
      type: String,
      default: null,
    },
    jobId: {
      type: String,
      default: null,
    },
    jobStatus: {
      type: String,
      enum: ["queued", "running", "completed", "failed"],
      default: "queued",
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
)

const submissionModel = mongoose.model("submission", submissionSchema)
module.exports = submissionModel

const mongoose = require("mongoose")

const roomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    status: {
      type: String,
      enum: ["waiting", "active", "completed"],
      default: "waiting",
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    challenge: {
      type: String,
      required: true,
    },
    roundDuration: {
      type: Number,
      default: 60,
    },
  },
  { timestamps: true }
)

const roomModel = mongoose.model("room", roomSchema)
module.exports = roomModel

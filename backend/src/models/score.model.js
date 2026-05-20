const mongoose = require("mongoose")

const scoreSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "room",
      required: true,
    },
    round: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "round",
      required: true,
    },
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "submission",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    rank: {
      type: Number,
      default: null,
    },
    eliminated: {
      type: Boolean,
      default: false,
    },
    givenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
)

const scoreModel = mongoose.model("score", scoreSchema)
module.exports = scoreModel

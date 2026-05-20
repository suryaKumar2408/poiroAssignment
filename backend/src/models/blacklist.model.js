const mongoose = require("mongoose")

const blacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // auto-delete after 24h (matches JWT expiry)
  },
})

const tokenBlacklistModel = mongoose.model("tokenBlacklist", blacklistSchema)
module.exports = tokenBlacklistModel

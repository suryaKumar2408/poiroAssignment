const express = require("express")
const scoreController = require("../controllers/score.controller")
const { authUser } = require("../middlewares/auth.middleware")

const scoreRouter = express.Router()

scoreRouter.post("/", authUser, scoreController.submitScore)
scoreRouter.get("/round/:roundId", authUser, scoreController.getRoundLeaderboard)
scoreRouter.get("/:roomCode", authUser, scoreController.getLeaderboard)

module.exports = scoreRouter

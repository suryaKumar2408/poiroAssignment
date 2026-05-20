const express = require("express")
const roundController = require("../controllers/round.controller")
const { authUser } = require("../middlewares/auth.middleware")

const roundRouter = express.Router()

roundRouter.post("/start", authUser, roundController.startRound)
roundRouter.post("/end", authUser, roundController.endRound)
roundRouter.get("/:roomCode", authUser, roundController.getRoundsByRoom)

module.exports = roundRouter

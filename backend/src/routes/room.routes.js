const express = require("express")
const roomController = require("../controllers/room.controller")
const { authUser } = require("../middlewares/auth.middleware")

const roomRouter = express.Router()

roomRouter.post("/create", authUser, roomController.createRoom)
roomRouter.post("/join", authUser, roomController.joinRoom)
roomRouter.get("/:code/state", authUser, roomController.getRoomState)
roomRouter.get("/:code", authUser, roomController.getRoomByCode)

module.exports = roomRouter

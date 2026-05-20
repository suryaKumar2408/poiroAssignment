const express = require("express")
const submissionController = require("../controllers/submission.controller")
const { authUser } = require("../middlewares/auth.middleware")

const submissionRouter = express.Router()

submissionRouter.post("/", authUser, submissionController.createSubmission)
submissionRouter.get("/single/:submissionId", authUser, submissionController.getSubmissionById)
submissionRouter.get("/:roundId", authUser, submissionController.getSubmissions)

module.exports = submissionRouter

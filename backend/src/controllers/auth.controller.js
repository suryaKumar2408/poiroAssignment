const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

async function registerUserController(req, res) {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" })
  }

  const isUserAlreadyExists = await userModel.findOne({
    $or: [{ username }, { email }],
  })

  if (isUserAlreadyExists) {
    return res.status(400).json({
      message: "Account already exists with this email or username",
    })
  }

  const hash = await bcrypt.hash(password, 10)

  const user = await userModel.create({ username, email, password: hash })

  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  )

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
  })

  return res.status(201).json({
    message: "User registered successfully",
    user: { id: user._id, username: user.username, email: user.email },
  })
}

async function loginUserController(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" })
  }

  const user = await userModel.findOne({ email })

  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid email or password" })
  }

  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  )

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
  })

  return res.status(200).json({
    message: "Logged in successfully",
    user: { id: user._id, username: user.username, email: user.email },
  })
}

async function logoutUserController(req, res) {
  const token = req.cookies.token

  if (token) {
    await tokenBlacklistModel.create({ token })
  }

  res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" })

  return res.status(200).json({ message: "Logged out successfully" })
}

async function getMeController(req, res) {
  const user = await userModel.findById(req.user.id).select("-password")

  if (!user) {
    return res.status(404).json({ message: "User not found" })
  }

  return res.status(200).json({
    message: "User details fetched",
    user: { id: user._id, username: user.username, email: user.email },
  })
}

module.exports = {
  registerUserController,
  loginUserController,
  logoutUserController,
  getMeController,
}

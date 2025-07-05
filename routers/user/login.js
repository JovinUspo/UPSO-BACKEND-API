// --------------------------
// File: routers/loginUser.js
// --------------------------
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs").promises;

const USERS_DB = path.join(__dirname, "../db/users.json");

const readUsers = async () => JSON.parse(await fs.readFile(USERS_DB, "utf8"));
const writeUsers = async (data) => await fs.writeFile(USERS_DB, JSON.stringify(data, null, 2));

const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "1d" });
  return { accessToken, refreshToken };
};

router.post("/login", async (req, res) => {
  const { mobile, password } = req.body;
  if (!mobile || !password)
    return res.status(400).json({ success: false, message: "Mobile and password required" });

  const users = await readUsers();
  const userIndex = users.findIndex((u) => u.mobile === mobile);
  const user = users[userIndex];

  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ success: false, message: "Invalid credentials" });

  const { accessToken, refreshToken } = generateTokens(user.id);

  user.refreshTokens = user.refreshTokens || [];
  if (!user.refreshTokens.includes(refreshToken)) {
    user.refreshTokens.push(refreshToken);
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  users[userIndex] = user;
  await writeUsers(users);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: { userId: user.id, accessToken, refreshToken },
  });
});

module.exports = router;


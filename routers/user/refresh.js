const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs").promises;

// Path to user database file
const USERS_DB = path.join(__dirname, "../../db/users.json");

// Read and parse user data
const readUsers = async () => JSON.parse(await fs.readFile(USERS_DB, "utf8"));

/**
 * @route POST /refresh/user
 * @desc Refresh access token for a regular user
 * @access Public (requires valid refresh token)
 */
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token required" });

  const users = await readUsers();
  const user = users.find((u) => u.refreshTokens?.includes(refreshToken));
  if (!user) return res.status(403).json({ message: "Invalid refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({ accessToken });
  } catch {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

module.exports = router;


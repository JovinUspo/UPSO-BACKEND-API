const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Driver = require("../../models/Driver");

/**
 * @route   POST /api/driver/refresh
 * @desc    Refresh access token for a driver using refresh token
 * @access  Public (needs valid refresh token)
 */
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  try {
    // Find driver with this refresh token
    const driver = await Driver.findOne({ refreshTokens: refreshToken });
    if (!driver) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Verify token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Generate new access token
    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({ accessToken });

  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

module.exports = router;

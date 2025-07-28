const express = require("express");
const router = express.Router();

// ----------------------------------------------------------------------
// POST /api/driver/logout
// Removes the refresh token from the driver's stored refreshTokens array
// ----------------------------------------------------------------------
const jwt = require("jsonwebtoken");
const Driver = require("../../models/Driver");
const BlacklistedToken = require("../../models/BlacklistedToken");

router.post("/logout", async (req, res) => {
  const { refreshToken, accessToken } = req.body;

  if (!refreshToken || !accessToken) {
    return res.status(400).json({
      success: false,
      message: "Both access and refresh tokens are required",
    });
  }

  try {
    // Remove refreshToken from DB
    const driver = await Driver.findOne({ refreshTokens: refreshToken });
    if (driver) {
      driver.refreshTokens = driver.refreshTokens.filter(t => t !== refreshToken);
      driver.activeStatus = "inactive"
      await driver.save();
    }

    // Decode access token to get expiry time
    const decoded = jwt.decode(accessToken);
    const expiresAt = new Date(decoded.exp * 1000);

    // Save access token to blacklist
    await BlacklistedToken.create({ token: accessToken, expiresAt });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;

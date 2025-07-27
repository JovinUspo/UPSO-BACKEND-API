const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Driver = require("../../models/Driver"); // Your Mongoose model

// JWT token generation
const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "1d" });
  return { accessToken, refreshToken };
};

// POST /api/driver/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const mobile = (req.body.mobile || "").trim();
    const otp = (req.body.otp || "").trim();

    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: "Mobile and OTP are required" });
    }

    const driver = await Driver.findOne({ mobile });

    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    if (!driver.otp || !driver.otpExpiresAt) {
      return res.status(400).json({ success: false, message: "No OTP found or already used" });
    }

    if (Date.now() > new Date(driver.otpExpiresAt).getTime()) {
      driver.otp = null;
      driver.otpExpiresAt = null;
      await driver.save();
      return res.status(410).json({ success: false, message: "OTP expired" });
    }

    if (driver.otp !== otp) {
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }

    // OTP is valid, clear it
    driver.otp = null;
    driver.otpExpiresAt = null;

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(driver._id.toString());

    driver.refreshTokens = driver.refreshTokens || [];

    if (!driver.refreshTokens.includes(refreshToken)) {
      driver.refreshTokens.push(refreshToken);
      driver.refreshTokens = driver.refreshTokens.slice(-5); // Keep latest 5
    }

    await driver.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: {
        driverId: driver._id,
        driverName: driver.userName,
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;

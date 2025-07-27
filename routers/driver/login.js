const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Driver = require("../../models/Driver");

// -----------------------------------------------------
// POST /api/driver/login
// Step 1 of OTP-based authentication
// -----------------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const mobile = (req.body.mobile || "").trim();

    // Validate mobile
    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number format",
      });
    }

    // Find driver by mobile
    const driver = await Driver.findOne({ mobile });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins from now

    // Save OTP in DB
    driver.otp = otp;
    driver.otpExpiresAt = expiresAt;
    await driver.save();

    // Simulate sending OTP
    console.log(`[MOCK] OTP for ${mobile}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully (mocked)",
      devOtp: otp, // remove this in production
    });

  } catch (err) {
    console.error("Driver login error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;

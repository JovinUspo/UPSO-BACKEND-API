const express = require("express");
const router = express.Router();
const Driver = require("../../models/Driver"); // Adjust path if needed
const authToken = require("../../middleware/authToken");
// ==============================================================================
// GET /api/driver/profile/:driverId
// Returns the driver's profile information
// ==============================================================================
router.get("/profile",authToken, async (req, res) => {
  try {
    const { driverId } = req;

    const driver = await Driver.findOne({ id: driverId });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    const {
      name,
      gender,
      mobile,
      dob,
      drivingLicenseNo,
      accountNo,
      ifscCode,
      address,
    } = driver;

    const date = new Date(dob);
    const formatted = date.toISOString().split('T')[0];

    return res.status(200).json({
      success: true,
      data: {
        name,
        gender,
        mobile,
        formatted,
        drivingLicenseNo,
        accountNo,
        ifscCode,
        address,
      },
    });
  } catch (err) {
    console.error("Profile API error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;

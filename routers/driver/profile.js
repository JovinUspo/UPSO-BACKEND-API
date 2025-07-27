const express = require("express");
const router = express.Router();
const Driver = require("../../models/Driver"); // Adjust path if needed

// ==============================================================================
// GET /api/driver/profile/:driverId
// Returns the driver's profile information
// ==============================================================================
router.get("/profile/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findOne({ id: driverId });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    const {
      userName,
      gender,
      mobile,
      dob,
      drivingLicenseNo,
      accountNo,
      ifscCode,
      address,
    } = driver;

    return res.status(200).json({
      success: true,
      data: {
        userName,
        gender,
        mobile,
        dob,
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

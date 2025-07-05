const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

const DRIVER_DB = path.join(__dirname, "../../db/driver.json");

const readDrivers = async () =>
  JSON.parse(await fs.readFile(DRIVER_DB, "utf-8"));

// ==============================================================================
// GET /api/driver/profile/:driverId
// Returns the driver's profile information
// ==============================================================================
router.get("/profile/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;
    const drivers = await readDrivers();
    const driver = drivers.find((d) => d.id === driverId);

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

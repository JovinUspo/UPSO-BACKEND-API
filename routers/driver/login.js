const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");

const DRIVER_DB = path.join(__dirname, "../../db/driver.json");

// Utility: Read driver list from JSON DB
const readDrivers = async () => JSON.parse(await fs.readFile(DRIVER_DB, "utf8"));

// Utility: Write driver list to JSON DB
const writeDrivers = async (data) =>
  await fs.writeFile(DRIVER_DB, JSON.stringify(data, null, 2));

/**
 * -----------------------------------------------------
 * POST /api/driver/login
 * -----------------------------------------------------
 * Step 1 of OTP-based authentication
 * - Accepts mobile number
 * - Verifies if driver exists
 * - Generates 6-digit OTP and sets 5-minute expiry
 * - Saves OTP in DB and mocks sending by logging
 */
router.post("/login", async (req, res) => {
  const mobile = (req.body.mobile || "").trim();

  // Validate mobile
  if (!mobile) {
    return res.status(400).json({
      success: false,
      message: "Mobile number is required",
    });
  }

  // Load drivers from file
  const drivers = await readDrivers();

  // Check if driver exists
  const driver = drivers.find((d) => d.mobile === mobile);
  if (!driver) {
    return res.status(404).json({
      success: false,
      message: "Driver not found",
    });
  }

  // Generate secure 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

  // Store OTP in driver record
  driver.otp = otp;
  driver.otpExpiresAt = expiresAt;

  await writeDrivers(drivers);

  // Simulate OTP delivery
  console.log(`[MOCK] OTP for driver ${mobile}: ${otp}`);

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully (mocked)",
    devOtp: otp // remove in production
  });
});

module.exports = router;

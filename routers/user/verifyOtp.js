const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

// Path to user database
const USERS_FILE = path.join(__dirname, "../../db/users.json");

// Read all users from the JSON file
const readUsers = async () =>
  JSON.parse(await fs.readFile(USERS_FILE, "utf8"));

// Write updated user list to the JSON file
const writeUsers = async (data) =>
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));

/**
 * @route   POST /user/verify-otp
 * @desc    Verifies OTP for a user based on mobile number
 * @access  Public
 */
router.post("/verify-otp", async (req, res) => {
  const mobile = (req.body.mobile || "").trim();
  const otp = (req.body.otp || "").trim();

  // Validate required fields
  if (!mobile || !otp) {
    return res.status(400).json({
      success: false,
      message: "Mobile and OTP are required",
    });
  }

  const users = await readUsers();
  const user = users.find((u) => u.mobile === mobile);

  // Check if user exists
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Check if OTP exists and is not already used
  if (!user.otp || !user.otpExpiresAt) {
    return res.status(400).json({
      success: false,
      message: "No OTP found or already used",
    });
  }

  // Check OTP expiry
  if (Date.now() > user.otpExpiresAt) {
    user.otp = null;
    user.otpExpiresAt = null;
    await writeUsers(users);
    return res.status(410).json({
      success: false,
      message: "OTP expired",
    });
  }

  // Match provided OTP with stored one
  if (user.otp !== otp) {
    return res.status(401).json({
      success: false,
      message: "Invalid OTP",
    });
  }

  // Clear OTP after successful verification
  user.otp = null;
  user.otpExpiresAt = null;
  await writeUsers(users);

  return res.status(200).json({
    success: true,
    message: "OTP verified successfully",
  });
});

module.exports = router;

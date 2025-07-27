const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const Driver = require("../../models/Driver");

const sanitizeInput = ({ userName, mobile, email, password }) => ({
  mobile: (mobile || "").trim(),
  userName: (userName || "").trim(),
  email: (email || "").trim().toLowerCase(),
  password: (password || "").trim(),
});

router.post("/signup", async (req, res) => {
  try {
    const { userName, mobile, email, password } = sanitizeInput(req.body);

    if (!userName || !mobile || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingDriver = await Driver.findOne({ mobile });

    if (existingDriver) {
      return res.status(409).json({
        success: false,
        message: "Driver with this mobile number already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDriver = new Driver({
      id: uuidv4(),
      userName,
      mobile,
      email,
      password: hashedPassword,
    });

    await newDriver.save();

    return res.status(201).json({
      success: true,
      message: "Driver signup successful",
      data: { driverId: newDriver.id },
    });
  } catch (err) {
    console.error("Driver signup error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;

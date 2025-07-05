const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs").promises;

// ------------------------
// @desc   Path to driver DB
// ------------------------
const DRIVER_DB = path.join(__dirname, "../../db/driver.json");

const readDrivers = async () => {
  try {
    const data = await fs.readFile(DRIVER_DB, "utf8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      await fs.writeFile(DRIVER_DB, "[]");
      return [];
    }
    throw err;
  }
};

const writeDrivers = async (data) =>
  await fs.writeFile(DRIVER_DB, JSON.stringify(data, null, 2));

const sanitizeInput = ({ userName, mobile, email, password }) => ({
  mobile: (mobile || "").trim(),
  userName: (userName || "").trim(),
  email: (email || "").trim().toLowerCase(),
  password: (password || "").trim(),
});

// ------------------------
// @route   POST /driver/signup
// @desc    Register a new driver
// @access  Public
// ------------------------
router.post("/signup", async (req, res) => {
  try {
    const {userName, mobile, email, password } = sanitizeInput(req.body);

    if (!userName|| !mobile || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const drivers = await readDrivers();

    if (drivers.some((d) => d.mobile === mobile)) {
      return res.status(409).json({
        success: false,
        message: "Driver with this mobile number already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDriver = {
      id: uuidv4(),
      userName,
      mobile,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    drivers.push(newDriver);
    await writeDrivers(drivers);

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

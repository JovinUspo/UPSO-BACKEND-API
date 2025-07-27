const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs").promises;

// ------------------------
// @desc   Path to user DB
// ------------------------
const USERS_DB = path.join(__dirname, "../../db/users.json");

// ------------------------
// @desc   Read all users
// ------------------------
const readUsers = async () => {
  try {
    const data = await fs.readFile(USERS_DB, "utf8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      await fs.writeFile(USERS_DB, "[]");
      return [];
    }
    throw err;
  }
};

// ------------------------
// @desc   Write updated users
// ------------------------
const writeUsers = async (data) =>
  await fs.writeFile(USERS_DB, JSON.stringify(data, null, 2));

// ------------------------
// @desc   Sanitize incoming input
// ------------------------
const sanitizeInput = ({ mobile, dob, email, gender, password }) => ({
  mobile: (mobile || "").trim(),
  dob: (dob || "").trim(),
  email: (email || "").trim().toLowerCase(),
  gender: (gender || "").trim().toLowerCase(),
  password: (password || "").trim(),
});

// ------------------------
// @route   POST /user/signup
// @desc    Register a new user
// @access  Public
// ------------------------
router.post("/signup", async (req, res) => {
  try {
    const { mobile, dob, email, gender, password } = sanitizeInput(req.body);

    if (!mobile || !dob || !email || !gender || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const users = await readUsers();

    if (users.some((u) => u.mobile === mobile)) {
      return res.status(409).json({
        success: false,
        message: "User with this mobile number already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: uuidv4(),
      mobile,
      dob,
      email,
      gender,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await writeUsers(users);

    return res.status(201).json({
      success: true,
      message: "User signup successful",
      data: { userId: newUser.id },
    });
  } catch (err) {
    console.error("User signup error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;

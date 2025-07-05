const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs").promises;

// ------------------------
// @desc   Path to vendor DB
// ------------------------
const VENDOR_DB = path.join(__dirname, "../../db/vendor.json");

const readVendors = async () => {
  try {
    const data = await fs.readFile(VENDOR_DB, "utf8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      await fs.writeFile(VENDOR_DB, "[]");
      return [];
    }
    throw err;
  }
};

const writeVendors = async (data) =>
  await fs.writeFile(VENDOR_DB, JSON.stringify(data, null, 2));

const sanitizeInput = ({ mobile, dob, email, gender, password }) => ({
  mobile: (mobile || "").trim(),
  dob: (dob || "").trim(),
  email: (email || "").trim().toLowerCase(),
  gender: (gender || "").trim().toLowerCase(),
  password: (password || "").trim(),
});

// ------------------------
// @route   POST /vendor/signup
// @desc    Register a new vendor
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

    const vendors = await readVendors();

    if (vendors.some((v) => v.mobile === mobile)) {
      return res.status(409).json({
        success: false,
        message: "Vendor with this mobile number already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newVendor = {
      id: uuidv4(),
      mobile,
      dob,
      email,
      gender,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    vendors.push(newVendor);
    await writeVendors(vendors);

    return res.status(201).json({
      success: true,
      message: "Vendor signup successful",
      data: { vendorId: newVendor.id },
    });
  } catch (err) {
    console.error("Vendor signup error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;

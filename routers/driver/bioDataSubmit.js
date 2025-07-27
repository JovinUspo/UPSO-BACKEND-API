const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const Driver = require("../../models/Driver");

// ------------------------
// @route   POST /bio-data-submit
// @desc    Submit driver bio-data
// ------------------------
router.post("/bio-data-submit", async (req, res) => {
  try {
    const {
      name,
      dob,
      mobile,
      gender,
      apartment,
      street,
      landmark,
      pincode,
    } = req.body;

    // Validate input
    if (!name || !dob || !mobile || !gender || !apartment || !street || !landmark || !pincode) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const trimmedMobile = mobile.trim();
    if (!/^\d{10}$/.test(trimmedMobile)) {
      return res.status(400).json({ success: false, message: "Mobile number must be 10 digits" });
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      return res.status(400).json({ success: false, message: "Pincode must be 6 digits" });
    }

    const parsedDOB = new Date(dob.trim());
    if (isNaN(parsedDOB.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid date of birth" });
    }

    const lowerGender = gender.trim().toLowerCase();
    if (!["male", "female", "other"].includes(lowerGender)) {
      return res.status(400).json({ success: false, message: "Invalid gender" });
    }

    // Check if driver with this mobile already exists
    const existingDriver = await Driver.findOne({ mobile: trimmedMobile });
    if (existingDriver) {
      return res.status(409).json({ success: false, message: "Driver with this mobile already exists" });
    }

    // Create new driver document
    const newDriver = new Driver({
      id: uuidv4(),
      name: name.trim(),
      dob: parsedDOB,
      mobile: trimmedMobile,
      gender: lowerGender,
      address: {
        apartment: apartment.trim(),
        street: street.trim(),
        landmark: landmark.trim(),
        pincode: pincode.trim(),
      },
    });

    await newDriver.save();

    return res.status(201).json({
      success: true,
      message: "Bio-data saved successfully",
      data: { driverId: newDriver.id },
    });

  } catch (err) {
    console.error("Bio-data save error:", err.stack || err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;

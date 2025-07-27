const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const Driver = require("../../models/Driver"); // ensure case-sensitive match!

// ------------------------
// @route   POST /bio-data-submit
// @desc    Submit driver bio-data
// ------------------------
router.post("/bio-data-submit", async (req, res) => {
  try {
    console.log("🚀 Bio-data submission started");
    console.log("📦 Request body:", req.body);

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
    const trimmedPincode = pincode.trim();
    const trimmedDOB = dob.trim();

    if (!/^\d{10}$/.test(trimmedMobile)) {
      return res.status(400).json({ success: false, message: "Mobile number must be 10 digits" });
    }

    if (!/^\d{6}$/.test(trimmedPincode)) {
      return res.status(400).json({ success: false, message: "Pincode must be 6 digits" });
    }

    if (isNaN(new Date(trimmedDOB).getTime())) {
      return res.status(400).json({ success: false, message: "Invalid date of birth" });
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
      dob: trimmedDOB,
      mobile: trimmedMobile,
      gender: gender.trim(),
      address: {
        apartment: apartment.trim(),
        street: street.trim(),
        landmark: landmark.trim(),
        pincode: trimmedPincode,
      },
    });

    await newDriver.save();

    console.log("Bio-data saved:", newDriver.id);

    return res.status(201).json({
      success: true,
      message: "Bio-data saved successfully",
      data: { driverId: newDriver.id },
    });

  } catch (err) {
    console.error("Bio-data save error:", err.stack);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;

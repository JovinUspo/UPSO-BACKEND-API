const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs").promises;

const DRIVER_DB = path.join(__dirname, "../../db/driver.json");

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
      pincode
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

    if (isNaN(new Date(dob.trim()).getTime())) {
      return res.status(400).json({ success: false, message: "Invalid date of birth" });
    }

    const drivers = await readDriverData();

    // Check for existing mobile
    const userExists = drivers.some(driver => driver.mobile === trimmedMobile);
    if (userExists) {
      return res.status(409).json({ success: false, message: "Driver with this mobile already exists" });
    }

    const newDriver = {
      id: uuidv4(),
      name: name.trim(),
      dob: dob.trim(),
      mobile: trimmedMobile,
      gender: gender.trim(),
      address: {
        apartment: apartment.trim(),
        street: street.trim(),
        landmark: landmark.trim(),
        pincode: pincode.trim()
      },
      submittedAt: new Date().toISOString(),
      // You can add a placeholder for bankDetails, initially null
      bankDetails: null
    };

    drivers.push(newDriver);
    await writeDriverData(drivers);

    return res.status(201).json({
      success: true,
      message: "Bio-data saved successfully",
      data: { driverId: newDriver.id }
    });

  } catch (err) {
    console.error("Bio-data save error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ------------------------
// Helper functions
// ------------------------
const readDriverData = async () => {
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

const writeDriverData = async (data) => {
  try {
    await fs.writeFile(DRIVER_DB, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to write to driver.json:", err);
    throw err;
  }
};

module.exports = router;

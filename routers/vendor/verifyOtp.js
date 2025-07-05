const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

const VENDORS_FILE = path.join(__dirname, "../../db/vendor.json");

const readVendors = async () =>
  JSON.parse(await fs.readFile(VENDORS_FILE, "utf8"));

const writeVendors = async (data) =>
  await fs.writeFile(VENDORS_FILE, JSON.stringify(data, null, 2));

router.post("/verify-otp", async (req, res) => {
  const mobile = (req.body.mobile || "").trim();
  const otp = (req.body.otp || "").trim();

  if (!mobile || !otp) {
    return res.status(400).json({
      success: false,
      message: "Mobile and OTP are required",
    });
  }

  const vendors = await readVendors();
  const vendor = vendors.find((u) => u.mobile === mobile);

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: "Vendor not found",
    });
  }

  if (!vendor.otp || !vendor.otpExpiresAt) {
    return res.status(400).json({
      success: false,
      message: "No OTP found or already used",
    });
  }

  if (Date.now() > vendor.otpExpiresAt) {
    vendor.otp = null;
    vendor.otpExpiresAt = null;
    await writeVendors(vendors);
    return res.status(410).json({
      success: false,
      message: "OTP expired",
    });
  }

  if (vendor.otp !== otp) {
    return res.status(401).json({
      success: false,
      message: "Invalid OTP",
    });
  }

  vendor.otp = null;
  vendor.otpExpiresAt = null;
  await writeVendors(vendors);

  return res.status(200).json({
    success: true,
    message: "OTP verified successfully",
  });
});

module.exports = router;

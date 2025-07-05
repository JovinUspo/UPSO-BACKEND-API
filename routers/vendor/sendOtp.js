const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");

const VENDORS_FILE = path.join(__dirname, "../../db/vendor.json");

const readVendors = async () =>
  JSON.parse(await fs.readFile(VENDORS_FILE, "utf8"));

const writeVendors = async (data) =>
  await fs.writeFile(VENDORS_FILE, JSON.stringify(data, null, 2));

router.post("/send-otp", async (req, res) => {
  const mobile = (req.body.mobile || "").trim();

  if (!mobile) {
    return res.status(400).json({
      success: false,
      message: "Mobile number is required",
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

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  vendor.otp = otp;
  vendor.otpExpiresAt = expiresAt;

  await writeVendors(vendors);

  console.log(`[MOCK] OTP for ${mobile} (vendor): ${otp}`);

  return res.status(200).json({
    success: true,
    message: `OTP sent successfully (mocked for vendor)`,
  });
});

module.exports = router;

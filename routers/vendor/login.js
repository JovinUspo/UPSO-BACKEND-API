const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs").promises;

const VENDOR_DB = path.join(__dirname, "../db/vendor.json");

const readVendors = async () => JSON.parse(await fs.readFile(VENDOR_DB, "utf8"));
const writeVendors = async (data) => await fs.writeFile(VENDOR_DB, JSON.stringify(data, null, 2));

const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "1d" });
  return { accessToken, refreshToken };
};

router.post("/login", async (req, res) => {
  const { mobile, password } = req.body;
  if (!mobile || !password)
    return res.status(400).json({ success: false, message: "Mobile and password required" });

  const vendors = await readVendors();
  const vendorIndex = vendors.findIndex((v) => v.mobile === mobile);
  const vendor = vendors[vendorIndex];

  if (!vendor || !(await bcrypt.compare(password, vendor.password)))
    return res.status(401).json({ success: false, message: "Invalid credentials" });

  const { accessToken, refreshToken } = generateTokens(vendor.id);

  vendor.refreshTokens = vendor.refreshTokens || [];
  if (!vendor.refreshTokens.includes(refreshToken)) {
    vendor.refreshTokens.push(refreshToken);
    vendor.refreshTokens = vendor.refreshTokens.slice(-5);
  }
  vendors[vendorIndex] = vendor;
  await writeVendors(vendors);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: { userId: vendor.id, accessToken, refreshToken },
  });
});

module.exports = router;

const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const jwt = require("jsonwebtoken");

const DRIVER_DB = path.join(__dirname, "../../db/driver.json");

const readDrivers = async () => JSON.parse(await fs.readFile(DRIVER_DB, "utf8"));
const writeDrivers = async (data) =>
  await fs.writeFile(DRIVER_DB, JSON.stringify(data, null, 2));

// Generate access + refresh tokens
const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "1d",
  });

  return { accessToken, refreshToken };
};

router.post("/verify-otp", async (req, res) => {
  const mobile = (req.body.mobile || "").trim();
  const otp = (req.body.otp || "").trim();

  if (!mobile || !otp) {
    return res.status(400).json({ success: false, message: "Mobile and OTP are required" });
  }

  const drivers = await readDrivers();
  const driverIndex = drivers.findIndex((d) => d.mobile === mobile);
  const driver = drivers[driverIndex];

  if (!driver) {
    return res.status(404).json({ success: false, message: "Driver not found" });
  }

  if (!driver.otp || !driver.otpExpiresAt) {
    return res.status(400).json({ success: false, message: "No OTP found or already used" });
  }

  if (Date.now() > driver.otpExpiresAt) {
    driver.otp = null;
    driver.otpExpiresAt = null;
    await writeDrivers(drivers);
    return res.status(410).json({ success: false, message: "OTP expired" });
  }

  if (driver.otp !== otp) {
    return res.status(401).json({ success: false, message: "Invalid OTP" });
  }

  // OTP is valid — clear it
  driver.otp = null;
  driver.otpExpiresAt = null;

  // Generate JWT tokens
  const { accessToken, refreshToken } = generateTokens(driver.id);

  driver.refreshTokens = driver.refreshTokens || [];
  if (!driver.refreshTokens.includes(refreshToken)) {
    driver.refreshTokens.push(refreshToken);
    driver.refreshTokens = driver.refreshTokens.slice(-5);
  }

  // Save updated driver
  drivers[driverIndex] = driver;
  await writeDrivers(drivers);

  return res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    data: {
      userId: driver.id,
      userName: driver.userName,
      accessToken,
      refreshToken,
    },
  });
});

module.exports = router;

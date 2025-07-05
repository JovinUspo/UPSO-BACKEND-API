
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs").promises;

// Path to driver database file
const DRIVER_DB = path.join(__dirname, "../../db/driver.json");

// Read and parse driver data
const readDrivers = async () => JSON.parse(await fs.readFile(DRIVER_DB, "utf8"));

/**
 * @route POST /refresh/driver
 * @desc Refresh access token for a driver
 * @access Public (requires valid refresh token)
 */
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token required" });

  const drivers = await readDrivers();
  const driver = drivers.find((u) => u.refreshTokens?.includes(refreshToken));
  if (!driver) return res.status(403).json({ message: "Invalid refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({ accessToken });
  } catch {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

module.exports = router;
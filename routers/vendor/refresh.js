const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs").promises;

// Path to vendor database file
const VENDOR_DB = path.join(__dirname, "../../db/vendor.json");

// Read and parse vendor data
const readVendors = async () => JSON.parse(await fs.readFile(VENDOR_DB, "utf8"));

/**
 * @route POST /refresh/vendor
 * @desc Refresh access token for a vendor
 * @access Public (requires valid refresh token)
 */
router.post("/refresh/vendor", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token required" });

  const vendors = await readVendors();
  const vendor = vendors.find((u) => u.refreshTokens?.includes(refreshToken));
  if (!vendor) return res.status(403).json({ message: "Invalid refresh token" });

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

const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

const VENDORS_FILE = path.join(__dirname, "../../db/vendor.json");

const readVendors = async () =>
  JSON.parse(await fs.readFile(VENDORS_FILE, "utf8"));

const writeVendors = async (data) =>
  await fs.writeFile(VENDORS_FILE, JSON.stringify(data, null, 2));

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  const vendors = await readVendors();
  const index = vendors.findIndex((u) => u.refreshTokens?.includes(refreshToken));

  if (index !== -1) {
    vendors[index].refreshTokens = vendors[index].refreshTokens.filter(
      (t) => t !== refreshToken
    );
    await writeVendors(vendors);
  }

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
    ...(index === -1 ? { note: "No active session found for provided token" } : {}),
  });
});

module.exports = router;

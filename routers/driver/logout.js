const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

const DRIVERS_FILE = path.join(__dirname, "../../db/driver.json");

const readDrivers = async () =>
  JSON.parse(await fs.readFile(DRIVERS_FILE, "utf8"));

const writeDrivers = async (data) =>
  await fs.writeFile(DRIVERS_FILE, JSON.stringify(data, null, 2));

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  const drivers = await readDrivers();
  const index = drivers.findIndex((u) => u.refreshTokens?.includes(refreshToken));

  if (index !== -1) {
    drivers[index].refreshTokens = drivers[index].refreshTokens.filter(
      (t) => t !== refreshToken
    );
    await writeDrivers(drivers);
  }

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
    ...(index === -1 ? { note: "No active session found for provided token" } : {}),
  });
});

module.exports = router;

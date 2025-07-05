const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const requestIp = require("request-ip");
const geoip = require("geoip-lite");

const DRIVER_DB = path.join(__dirname, "../../db/driver.json");

// ------------------------
// Helper: Read & write DB
// ------------------------
const readDrivers = async () => JSON.parse(await fs.readFile(DRIVER_DB, "utf8"));
const writeDrivers = async (data) => await fs.writeFile(DRIVER_DB, JSON.stringify(data, null, 2));

// ------------------------
// Helper: Validate coordinates
// ------------------------
function isValidLocation(loc) {
  return (
    loc &&
    typeof loc.latitude === "number" &&
    typeof loc.longitude === "number" &&
    loc.latitude >= -90 &&
    loc.latitude <= 90 &&
    loc.longitude >= -180 &&
    loc.longitude <= 180
  );
}

// ------------------------
// Helper: Resolve location via IP
// ------------------------
function resolveLocationFromIP(req) {
  let ip = requestIp.getClientIp(req) || "";
  ip = ip.replace("::ffff:", "");

  const geo = geoip.lookup(ip);
  if (!geo || !geo.ll) return null;

  return {
    latitude: geo.ll[0],
    longitude: geo.ll[1],
    city: geo.city || '',
    region: geo.region || '',
    country: geo.country || '',
    ip
  };
}

// ------------------------
// POST /location
// Updates driver's location
// ------------------------
router.post("/location", async (req, res) => {
  try {
    const { driverId, location } = req.body;

    // Validate required field
    if (!driverId || typeof driverId !== "string") {
      return res.status(400).json({ success: false, message: "Valid driverId is required" });
    }

    const drivers = await readDrivers();
    const index = drivers.findIndex(d => d.id === driverId);

    if (index === -1) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    // Determine final location
    let finalLocation = isValidLocation(location)
      ? { ...location }
      : resolveLocationFromIP(req);

    if (!finalLocation) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates and IP-based location unavailable"
      });
    }

    // Add timestamp
    finalLocation.updatedAt = new Date().toISOString();

    // Update driver record immutably
    const updatedDriver = { ...drivers[index], location: finalLocation };
    drivers[index] = updatedDriver;

    await writeDrivers(drivers);

    return res.status(200).json({
      success: true,
      message: "Driver location updated successfully",
      data: finalLocation
    });

  } catch (err) {
    console.error("Driver location update error:", err);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "development" ? err.message : "Internal server error"
    });
  }
});

module.exports = router;

// locationFilter.js

require("dotenv").config(); // Load environment variables from .env

const geoip = require("geoip-lite");
const requestIp = require("request-ip");

// Parse allowed country codes from .env (e.g., "IN,CA")
const allowedCountries = process.env.ALLOWED_COUNTRIES
  ? process.env.ALLOWED_COUNTRIES.split(",").map(code => code.trim().toUpperCase())
  : [];

/**
 * Middleware to restrict access based on the user's geographical location.
 * Blocks any IP address not matching the allowedCountries list.
 */
function locationFilter(req, res, next) {
  // Extract the client IP address using request-ip (handles proxies and headers)
  const ip = requestIp.getClientIp(req); // e.g., "103.21.244.0", "::1", etc.

  // Use geoip-lite to determine geographic info from the IP address
  const geo = geoip.lookup(ip); // Returns { country: 'IN', ... } or null

  // Debug logs (can be disabled in production)
  console.log("Client IP:", ip);
  console.log("Geo Lookup Result:", geo);

  // Case 1: Unable to determine geographic info
  if (!geo || !geo.country) {
    console.warn(`Blocked access: Unknown or unresolvable IP (${ip})`);
    return res.status(403).json({
      error: "Location could not be determined. Access denied.",
    });
  }

  // Case 2: IP's country not in the allowed list
  if (!allowedCountries.includes(geo.country)) {
    console.warn(`Blocked access from ${geo.country} (${ip})`);
    return res.status(403).json({
      error: "Access denied: your country is not allowed",
      your_country: geo.country,
    });
  }

  // Case 3: Country is allowed – pass control to the next middleware
  next();
}

module.exports = locationFilter;

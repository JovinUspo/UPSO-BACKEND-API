const express = require('express');
const router = express.Router();
const geoip = require('geoip-lite'); // Library for IP geolocation
const requestIp = require('request-ip'); // Extracts client's IP reliably behind proxies
const fs = require('fs').promises;
const path = require('path');

// Path to the users JSON database
const USERS_FILE_PATH = path.join(__dirname, '../db/users.json');

/**
 * Read all users from the database (users.json)
 */
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') return []; // File doesn't exist yet
    throw error;
  }
}

/**
 * Write updated users array to the users.json file
 * @param {Array} users - Array of user objects to be written
 */
async function writeUsers(users) {
  await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf8');
}

/**
 * Check if a location object has valid latitude and longitude
 * @param {Object} location - Location object containing lat/lng
 */
function isValidLocation(location) {
  return (
    location &&
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180
  );
}

/**
 * Check if an IP address is public (non-local, non-private range)
 * @param {string} ip - IP address to validate
 */
function isValidIp(ip) {
  if (!ip) return false;
  ip = ip.replace('::ffff:', ''); // IPv6 mapped format to IPv4
  return !(
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('169.254.')
  );
}

/**
 * @route POST /location
 * @desc Saves user location, either from provided lat/lng or detected via IP
 * @access Public (user must provide valid userId)
 */
router.post('/location', async (req, res) => {
  try {
    const { userId, location } = req.body;

    // Validate required userId
    if (typeof userId !== 'string' || userId.trim() === '') {
      return res.status(400).json({ success: false, message: 'Valid userId is required' });
    }

    const users = await readUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    // Check if user exists
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let finalLocation = location;

    // If location is not provided or invalid, attempt IP-based lookup
    if (!isValidLocation(finalLocation)) {
      let ip = requestIp.getClientIp(req) || '';
      ip = ip.replace('::ffff:', '');

      if (!isValidIp(ip)) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Fallback: using mock IP for local testing`);
          ip = '103.15.66.98'; // Configurable fallback IP
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid or local IP. Cannot detect location.'
          });
        }
      }

      const geo = geoip.lookup(ip);

      // Fail if geo lookup fails
      if (!geo || !Array.isArray(geo.ll) || geo.ll.length !== 2) {
        return res.status(404).json({ success: false, message: 'Could not determine location from IP' });
      }

      // Construct location from geoip response
      finalLocation = {
        plusCode: '',
        address: [geo.city, geo.region, geo.country].filter(Boolean).join(', ') || 'Unknown location',
        latitude: geo.ll[0],
        longitude: geo.ll[1],
        city: geo.city || '',
        region: geo.region || '',
        country: geo.country || '',
        ip: ip
      };
    }

    // Structure to save to DB
    const locationToSave = {
      plusCode: finalLocation.plusCode || '',
      address: finalLocation.address || 'Unknown location',
      latitude: finalLocation.latitude,
      longitude: finalLocation.longitude,
      city: finalLocation.city || '',
      region: finalLocation.region || '',
      country: finalLocation.country || '',
      ip: finalLocation.ip || '',
      updatedAt: new Date().toISOString()
    };

    // Update user record
    users[userIndex].location = locationToSave;
    users[userIndex].updatedAt = new Date().toISOString();
    await writeUsers(users);

    // Respond to client
    return res.status(200).json({
      success: true,
      message: 'Location saved successfully',
      data: {
        userId,
        ...locationToSave
      }
    });

  } catch (error) {
    console.error('Error in /location endpoint:', error);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;

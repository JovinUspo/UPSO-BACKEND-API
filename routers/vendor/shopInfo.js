// shopInfo.js - Allows only vendors to add or update their shop information (without image support)

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// Path to the vendor database file
const VENDOR_DB = path.join(__dirname, '../db/vendor.json');

// Helper to read all vendors from the JSON file
const readVendors = async () => {
  const data = await fs.readFile(VENDOR_DB, 'utf8');
  return JSON.parse(data);
};

// Helper to write updated vendor data back to the JSON file
const writeVendors = async (vendors) => {
  await fs.writeFile(VENDOR_DB, JSON.stringify(vendors, null, 2));
};

/**
 * @route   POST /api/shop-info
 * @desc    Create or update shop info for a vendor
 * @access  Public (with userType validation for "vendor")
 */
router.post('/shop-info', async (req, res) => {
  try {
    const { userId, userType, shopInfo } = req.body;

    // Validate the basic input structure
    if (!userId || !userType || typeof shopInfo !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'userId, userType, and shopInfo are required',
      });
    }

    // Restrict access to only vendors
    if (userType !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only vendors can update shop info.',
      });
    }

    // Read all vendors from storage
    const vendors = await readVendors();
    const vendorIndex = vendors.findIndex(v => v.id === userId);

    if (vendorIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    // Extract and validate shop information fields (excluding image)
    const {
      name = '',
      description = '',
      address = '',
      latitude = null,
      longitude = null,
    } = shopInfo;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Shop name is required and must be a string',
      });
    }

    // Create a structured object for storing shop info
    const updatedShopInfo = {
      name,
      description,
      address,
      latitude,
      longitude,
      updatedAt: new Date().toISOString(),
    };

    // Update the vendor's data
    vendors[vendorIndex].shopInfo = updatedShopInfo;
    vendors[vendorIndex].updatedAt = new Date().toISOString();

    await writeVendors(vendors);

    return res.status(200).json({
      success: true,
      message: 'Shop info saved successfully',
      data: {
        userId,
        shopInfo: updatedShopInfo,
      },
    });

  } catch (error) {
    console.error('Error in /shop-info:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;

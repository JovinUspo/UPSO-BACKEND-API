// addProduct.js – API for vendors to add new products

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

// Path to the product database (JSON)
const PRODUCTS_DB = path.join(__dirname, '../db/products.json');
const VENDOR_DB = path.join(__dirname, '../db/vendor.json');

// Helper: Read existing products
const readProducts = async () => {
  try {
    const data = await fs.readFile(PRODUCTS_DB, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(PRODUCTS_DB, '[]');
      return [];
    }
    throw err;
  }
};

// Helper: Write updated products
const writeProducts = async (products) => {
  await fs.writeFile(PRODUCTS_DB, JSON.stringify(products, null, 2));
};

// Helper: Check if vendor exists
const vendorExists = async (vendorId) => {
  try {
    const data = await fs.readFile(VENDOR_DB, 'utf8');
    const vendors = JSON.parse(data);
    return vendors.some((v) => v.id === vendorId);
  } catch (err) {
    return false;
  }
};

/**
 * @route   POST /api/add-product
 * @desc    Add a new product (Only accessible by vendors)
 * @access  Vendor Only
 */
router.post('/add-product', async (req, res) => {
  try {
    const { userId, userType, product } = req.body;

    // Validate request
    if (!userId || !userType || typeof product !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'userId, userType, and product object are required',
      });
    }

    // Restrict access to only vendors
    if (userType !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only vendors can add products.',
      });
    }

    // Confirm vendor exists
    const isVendorValid = await vendorExists(userId);
    if (!isVendorValid) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    // Extract and validate product fields
    const {
      name,
      description = '',
      price,
      category = '',
      stock = 0,
      unit = 'pcs',
    } = product;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ success: false, message: 'Valid product price is required' });
    }

    // Generate and build new product object
    const newProduct = {
      id: uuidv4(),
      vendorId: userId,
      name,
      description,
      category,
      price,
      stock,
      unit,
      createdAt: new Date().toISOString(),
    };

    // Save to database
    const products = await readProducts();
    products.push(newProduct);
    await writeProducts(products);

    return res.status(201).json({
      success: true,
      message: 'Product added successfully',
      data: newProduct,
    });

  } catch (err) {
    console.error('Error in /add-product:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;

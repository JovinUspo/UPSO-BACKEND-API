const express = require("express");
const router = express.Router();
const Order = require("../../models/Order");
const authToken = require("../../middleware/authToken");
// ==================================================================
// POST /api/driver/order/items-collected
// Body: { driverId, orderId, products: [string] }
// ==================================================================
router.post("/order/items-collected",authToken, async (req, res) => {
  try {
    const { driverId, orderId, products } = req.body;

    if (!driverId || !orderId || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "driverId, orderId and product list are required",
      });
    }

    const order = await Order.findOne({ driverId, orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for this driver",
      });
    }

    if (order.status !== "picked") {
      return res.status(400).json({
        success: false,
        message: "Order must be in 'picked' status before item collection",
      });
    }

    order.status = "items_collected";
    order.collectedItems = products;
    order.itemsCollectedAt = new Date();

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Items collected successfully",
    });
  } catch (err) {
    console.error("Items collected error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;

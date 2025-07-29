const express = require("express");
const router = express.Router();
const Order = require("../../models/Order");
const authToken = require("../../middleware/authToken");
// ==================================================================
// GET /api/driver/order/items-to-collect/:orderId
// Returns list of products to collect for a given order
// ==================================================================
router.get("/order/items-to-collect/:orderId",authToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).select("products");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.orderId,
        products: order.products || [],
      },
    });
  } catch (err) {
    console.error("Get items to collect error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;

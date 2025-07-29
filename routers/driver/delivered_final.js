const express = require("express");
const router = express.Router();
const Order = require("../../models/Order");
const authToken = require("../../middleware/authToken");

// POST /api/driver/order/delivery-reached
router.post("/order/delivered",authToken, async (req, res) => {
  const { orderId, orderStatus, paymentMenthod } = req.body;

  if (!orderId) {
    return res.status(400).json({ success: false, message: "orderId is required" });
  }

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.deliveryReachedAt = new Date();
    order.status = orderStatus;
    order.paymentMode = paymentMenthod;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order Status marked as delivered"
    });
  } catch (err) {
    console.error("Delivery reached error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;

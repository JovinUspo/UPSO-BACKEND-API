const express = require("express");
const router = express.Router();
const Order = require("../../models/Order");

// POST /api/driver/order/delivery-reached
router.post("/order/delivery-reached", async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ success: false, message: "orderId is required" });
  }

  try {
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.deliveryReachedAt = new Date();
    order.status = "reached";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Delivery point marked as reached"
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

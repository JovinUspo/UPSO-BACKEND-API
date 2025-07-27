const express = require("express");
const router = express.Router();
const Order = require("../../models/Order");

// ----------------------------------------------------------------------
// GET /api/driver/order/delivery-summary/:orderId
// Returns order summary including address and cash to collect
// ----------------------------------------------------------------------
router.get("/order/delivery-summary/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.orderId,
        deliveryName: order.customerName,
        deliveryAddress: order.deliveryAddress,
        paymentMode: order.paymentMode || "Cash",
        cashToCollect: order.cashToCollect || 0,
      }
    });
  } catch (err) {
    console.error("Delivery summary error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// ----------------------------------------------------------------------
// POST /api/driver/order/delivery-status
// Updates the final delivery status (delivered or not_delivered)
// ----------------------------------------------------------------------
router.post("/order/delivery-status", async (req, res) => {
  try {
    const { driverId, orderId, status } = req.body;

    if (!driverId || !orderId || !["delivered", "not_delivered"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    const order = await Order.findOne({ orderId, driverId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found for driver" });
    }

    order.status = status;
    order.deliveredAt = new Date();
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order marked as ${status.replace("_", " ")} successfully`
    });
  } catch (err) {
    console.error("Delivery status error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;

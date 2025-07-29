const express = require("express");
const router = express.Router();
const Order = require("../../models/Order");
const authToken = require("../../middleware/authToken");

// GET /api/driver/order/delivery-info/:orderId
router.get("/order/delivery-info/:orderId",authToken, async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        customerName: order.customerName,
        customerPhoneNo: order.customerPhoneNo,
        address: order.deliveryAddress,
        latitude: order.deliveryLatitude,
        longitude: order.deliveryLongitude,
      }
    });
  } catch (err) {
    console.error("Delivery info error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const authToken = require("../../middleware/authToken");
const Order = require("../../models/Order");

/**
 * ============================================================================
 * POST /api/driver/order/status
 *
 * @headers Authorization: Bearer <accessToken>
 * @body { driverId, orderId, action }
 *        action must be either "pickup_reached" or "items_collected" or
      "reached" or "delivered" or "not_delivered" or "completed" or "cancelled"
 * ============================================================================
 */
router.post("/order/status", authToken, async (req, res) => {
  try {
    const { orderId, action } = req.body;
    const VALID_ACTIONS = ["pickup_reached", "items_collected",
      "reached", "delivered", "not_delivered", "completed", "cancelled"];

    if (!orderId || !VALID_ACTIONS.includes(action)) {
      return res.status(400).json({
        success: false,
        message: "orderId and valid action ( pickup_reached, items_collected, reached, delivered, not_delivered, completed ) are required",
      });
    }

    const order = await Order.findById(orderId);

    if(!order){
      return res.status(404).json({success:false,message:"order not found"})
    }


    // Update order status
    order.status = action.trim();
    order.respondedAt = new Date();
    order.driverId = req.driverId;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order ${action}ed successfully`,
      data: {
        orderId: order.orderId,
        driverId: order.driverId,
        status: order.status,
      },
    });
  } catch (err) {
    console.error("Order respond error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const authToken = require("../../middleware/authToken");
const Order = require("../../models/Order");

/**
 * ============================================================================
 * POST /api/driver/order/respond
 * Accept or decline a new order
 *
 * @headers Authorization: Bearer <accessToken>
 * @body { driverId, orderId, action }
 *        action must be either "accept" or "decline"
 * ============================================================================
 */
router.post("/order/respond", authToken, async (req, res) => {
  try {
    const { driverId, orderId, action } = req.body;
    const VALID_ACTIONS = ["accept", "decline"];

    if (!driverId || !orderId || !VALID_ACTIONS.includes(action)) {
      return res.status(400).json({
        success: false,
        message: "driverId, orderId and valid action ('accept' or 'decline') are required",
      });
    }

    // Ensure token driver matches driverId
    if (req.user.id !== driverId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: driverId does not match the access token",
      });
    }

    const order = await Order.findOne({ orderId, driverId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for this driver",
      });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Order is no longer pending",
      });
    }

    // Update order status
    order.status = action === "accept" ? "accepted" : "declined";
    order.respondedAt = new Date();

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order ${action}ed successfully`,
      data: {
        orderId: order.orderId,
        driverId: order.driverId,
        status: order.status,
        distanceKm: order.distanceKm,
        amount: order.amount,
        respondedAt: order.respondedAt,
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

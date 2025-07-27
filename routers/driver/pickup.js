const express = require("express");
const router = express.Router();
const Order = require("../../models/Order");

/**
 * =============================================================================
 * GET /api/driver/order/pickup/:driverId
 * - Returns pickup order details (shop name, location) for the assigned driver.
 * =============================================================================
 */
router.get("/order/pickup/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    const activeOrder = await Order.findOne({
      driverId,
      status: "accepted",
    });

    if (!activeOrder) {
      return res.status(404).json({
        success: false,
        message: "No active pickup order found for this driver",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: activeOrder.orderId,
        shopName: activeOrder.shopName || "Test Shop",
        shopAddress: activeOrder.shopAddress || "123, Market Street, City",
        pickupLocation: {
          latitude: activeOrder.pickupLatitude || 0,
          longitude: activeOrder.pickupLongitude || 0,
        },
        amount: activeOrder.amount,
        distanceKm: activeOrder.distanceKm,
      },
    });
  } catch (err) {
    console.error("Pickup order fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * =============================================================================
 * POST /api/driver/order/pickup/reached
 * - Marks that driver has reached pickup location
 * - Body: { driverId, orderId }
 * =============================================================================
 */
router.post("/order/pickup/reached", async (req, res) => {
  try {
    const { driverId, orderId } = req.body;

    if (!driverId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "driverId and orderId are required",
      });
    }

    const order = await Order.findOne({ driverId, orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for this driver",
      });
    }

    order.pickupReachedAt = new Date();
    order.status = "picked";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Pickup marked as reached",
    });
  } catch (err) {
    console.error("Pickup reached error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;

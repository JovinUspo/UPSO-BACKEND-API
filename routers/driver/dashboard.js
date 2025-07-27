const express = require("express");
const router = express.Router();
const authToken = require("../../middleware/authToken");

const Driver = require("../../models/Driver");
const Order = require("../../models/Order");

// =============================================================================
// GET /api/driver/dashboard/:driverId
// Returns driver profile summary, status, and recent completed orders.
// =============================================================================

router.get("/dashboard/:driverId", authToken, async (req, res) => {
  try {
    const { driverId } = req.params;

    // Fetch driver by custom `id` field (not _id)
    const driver = await Driver.findOne({ id: driverId });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Fetch completed orders for the driver
    const completedOrders = await Order.find({
      driverId,
      status: "completed",
    }).select("orderId distanceKm amount -_id"); // remove _id

    return res.status(200).json({
      success: true,
      data: {
        name: driver.name,
        status: driver.activeStatus ? "active" : "inactive",
        currentStatus: "Waiting for new order",
        completedOrders,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;

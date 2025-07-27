const express = require("express");
const router = express.Router();
const authToken = require("../../middleware/authToken");
const Order = require("../../models/Order");

// ===========================================================================
// GET /api/driver/order/pending/:driverId
// Returns a pending (new) order assigned to the driver
// ===========================================================================
router.get("/order/pending/:driverId", authToken, async (req, res) => {
  try {
    const { driverId } = req.params;

    const newOrder = await Order.findOne({
      driverId,
      status: "pending",
    }).select("orderId distanceKm amount -_id");

    if (!newOrder) {
      return res.status(404).json({
        success: false,
        message: "No new orders assigned to this driver",
      });
    }

    return res.status(200).json({
      success: true,
      message: "New order found",
      data: newOrder,
    });
  } catch (err) {
    console.error("Pending order fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;

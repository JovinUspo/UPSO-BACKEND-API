const express = require("express");
const router = express.Router();
const Order = require("../../models/Order"); 

// ==============================================================================
// GET /api/driver/earnings/:driverId
// Returns wallet total and delivered order transactions for the driver
// ==============================================================================
router.get("/earnings/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    const completedOrders = await Order.find({
      driverId,
      status: "delivered"
    }).sort({ deliveredAt: -1 }); // Latest first

    const walletAmount = completedOrders.reduce(
      (total, order) => total + (order.cashToCollect || 0),
      0
    );

    const transactions = completedOrders.map((order) => {
      const deliveredTime = new Date(order.deliveredAt || order.respondedAt || order.createdAt);
      const date = deliveredTime.toLocaleDateString("en-GB"); // DD/MM/YYYY
      const time = deliveredTime.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }); // e.g. 02:00 PM

      return {
        orderId: order.orderId,
        date,
        time,
        amount: order.cashToCollect || 0,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        walletAmount,
        transactions,
      },
    });
  } catch (err) {
    console.error("Earnings API error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;

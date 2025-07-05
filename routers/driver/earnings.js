const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

const ORDER_DB = path.join(__dirname, "../../db/orders.json");

const readOrders = async () =>
  JSON.parse(await fs.readFile(ORDER_DB, "utf-8"));

// ==============================================================================
// GET /api/driver/earnings/:driverId
// Returns wallet total and delivered order transactions for the driver
// ==============================================================================
router.get("/earnings/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;
    const orders = await readOrders();

    const completedOrders = orders.filter(
      (o) => o.driverId === driverId && o.status === "delivered"
    );

    const walletAmount = completedOrders.reduce(
      (total, order) => total + (order.cashToCollect),
      0
    );

    const transactions = completedOrders.map((order) => {
      const deliveredTime = new Date(order.deliveredAt || order.respondedAt || Date.now());
      const date = deliveredTime.toLocaleDateString("en-GB"); // e.g., 07/02/2021
      const time = deliveredTime.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }); // e.g., 2:00 PM

      return {
        orderId: order.orderId,
        date,
        time,
        amount: order.cashToCollect,
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

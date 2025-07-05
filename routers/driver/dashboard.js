const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

// JWT Token Auth middleware
const authToken = require("../../middleware/authToken")

const DRIVER_DB = path.join(__dirname, "../../db/driver.json");
const ORDER_DB = path.join(__dirname, "../../db/orders.json");

const readDrivers = async () => JSON.parse( await fs.readFile(DRIVER_DB, "utf-8"));
const readOrders = async () => JSON.parse( await fs.readFile(ORDER_DB, "utf-8"));

// =============================================================================
// GET /api/driver/dashboard/:driverId
// Returns driver profile summary, status, and recent completed orders.
// =============================================================================

router.get("/dashboard/:driverId",authToken, async (req, res) => {
  try {
    const { driverId } = req.params;

    const drivers = await readDrivers();
    const driver = drivers.find((d) => d.id === driverId);

    if (!driver) {
      return res
        .status(404)
        .json({ success: false, message: "Driver not found" });
    }

    const orders = await readOrders();

    const completedOrders = orders
      .filter((o) => o.driverId === driverId && o.status === "completed")
      .map((order) => ({
        orderId: order.orderId,
        distanceKm: order.distanceKm,
        amount: order.amount,
      }));

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

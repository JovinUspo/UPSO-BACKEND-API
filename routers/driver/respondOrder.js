const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

// Middleware to verify JWT access token
const authToken = require("../../middleware/authToken");

const ORDER_DB = path.join(__dirname, "../../db/orders.json");

// Utility functions to read/write orders JSON
const readOrders = async () => JSON.parse(await fs.readFile(ORDER_DB, "utf-8"));
const writeOrders = async (data) =>
  await fs.writeFile(ORDER_DB, JSON.stringify(data, null, 2));

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

    // Validate required fields and action
    if (!driverId || !orderId || !VALID_ACTIONS.includes(action)) {
      return res.status(400).json({
        success: false,
        message: "driverId, orderId and valid action ('accept' or 'decline') are required",
      });
    }

    // Ensure token matches the driver performing the action
    if (req.user.id !== driverId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: driverId does not match the access token",
      });
    }

    const orders = await readOrders();

    // Find the order for this driver
    const orderIndex = orders.findIndex(
      (order) => order.orderId === orderId && order.driverId === driverId
    );

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Order not found for this driver",
      });
    }

    // Ensure the order is still pending
    if (orders[orderIndex].status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Order is no longer pending",
      });
    }

    // Update order status
    orders[orderIndex].status = action === "accept" ? "accepted" : "declined";
    orders[orderIndex].respondedAt = new Date().toISOString();

    await writeOrders(orders);

    return res.status(200).json({
      success: true,
      message: `Order ${action}ed successfully`,
      data: orders[orderIndex],
    });
  } catch (error) {
    console.error("Order respond error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;

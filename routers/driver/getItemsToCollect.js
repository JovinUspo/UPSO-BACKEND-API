const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

const ORDER_DB = path.join(__dirname, "../../db/orders.json");

const readOrders = async () => JSON.parse(await fs.readFile(ORDER_DB, "utf-8"));

// ==================================================================
// GET /api/driver/order/items-to-collect/:orderId
// Returns list of products to collect for a given order
// ==================================================================
router.get("/order/items-to-collect/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const orders = await readOrders();
    const order = orders.find((o) => o.orderId === orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.orderId,
        products: order.products || [],  // assume this key exists in order
      },
    });
  } catch (err) {
    console.error("Get items to collect error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;

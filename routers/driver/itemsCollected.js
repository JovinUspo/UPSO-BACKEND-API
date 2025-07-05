const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

const ORDER_DB = path.join(__dirname, "../../db/orders.json");

// Read/Write helpers
const readOrders = async () => JSON.parse(await fs.readFile(ORDER_DB, "utf-8"));
const writeOrders = async (data) =>
  await fs.writeFile(ORDER_DB, JSON.stringify(data, null, 2));

// ==================================================================
// POST /api/driver/order/items-collected
// Body: { driverId, orderId, products: [string] }
// ==================================================================
router.post("/order/items-collected", async (req, res) => {
  try {
    const { driverId, orderId, products } = req.body;

    if (!driverId || !orderId || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "driverId, orderId and product list are required",
      });
    }

    const orders = await readOrders();
    const orderIndex = orders.findIndex(
      (o) => o.orderId === orderId && o.driverId === driverId
    );

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Order not found for this driver",
      });
    }

    if (orders[orderIndex].status !== "picked") {
      return res.status(400).json({
        success: false,
        message: "Order must be in 'picked' status before item collection",
      });
    }

    orders[orderIndex].status = "items_collected";
    orders[orderIndex].collectedItems = products;
    orders[orderIndex].itemsCollectedAt = new Date().toISOString();

    await writeOrders(orders);

    return res.status(200).json({
      success: true,
      message: "Items collected successfully",
    });
  } catch (err) {
    console.error("Items collected error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;

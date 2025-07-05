const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

const ORDER_DB = path.join(__dirname, "../../db/orders.json");
const readOrders = async () => JSON.parse(await fs.readFile(ORDER_DB, "utf-8"));
const writeOrders = async (data) => await fs.writeFile(ORDER_DB, JSON.stringify(data, null, 2));

// POST /api/driver/order/delivery-reached
router.post("/order/delivery-reached", async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ success: false, message: "orderId is required" });
  }

  try {
    const orders = await readOrders();
    const index = orders.findIndex(o => o.orderId === orderId);

    if (index === -1) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    orders[index].deliveryReachedAt = new Date().toISOString();
    orders[index].status = "reached";

    await writeOrders(orders);

    return res.status(200).json({ success: true, message: "Delivery point marked as reached" });
  } catch (err) {
    console.error("Delivery reached error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;

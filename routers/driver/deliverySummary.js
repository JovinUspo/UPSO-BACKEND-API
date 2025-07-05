const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

const ORDER_DB = path.join(__dirname, "../../db/orders.json");

const readOrders = async () => JSON.parse(await fs.readFile(ORDER_DB, "utf-8"));

// GET delivery summary
router.get("/order/delivery-summary/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = await readOrders();
    const order = orders.find(o => o.orderId === orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.orderId,
        deliveryName: order.customerName,
        deliveryAddress: order.deliveryAddress,
        paymentMode: order.paymentMode,
        cashToCollect: order.cashToCollect,
      }
    });
  } catch (err) {
    console.error("Delivery summary error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// Update delivery status
router.post("/order/delivery-status", async (req, res) => {
  try {
    const { driverId, orderId, status } = req.body;

    if (!driverId || !orderId || !["delivered", "not_delivered"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    const orders = await readOrders();
    const index = orders.findIndex(o => o.orderId === orderId && o.driverId === driverId);

    if (index === -1) {
      return res.status(404).json({ success: false, message: "Order not found for driver" });
    }

    orders[index].status = status;
    orders[index].deliveredAt = new Date().toISOString();

    await fs.writeFile(ORDER_DB, JSON.stringify(orders, null, 2));

    return res.status(200).json({
      success: true,
      message: `Order marked as ${status.replace("_", " ")} successfully`
    });
  } catch (err) {
    console.error("Delivery status error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;

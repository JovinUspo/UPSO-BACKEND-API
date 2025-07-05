const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

const ORDER_DB = path.join(__dirname, "../../db/orders.json");
const readOrders = async () => JSON.parse(await fs.readFile(ORDER_DB, "utf-8"));

// GET /api/driver/order/delivery-info/:orderId
router.get("/order/delivery-info/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const orders = await readOrders();
    const order = orders.find(o => o.orderId === `${orderId}` || o.orderId === orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.orderId,
        customerName: order.customerName ,
        customerPhoneNo: order.customerPhoneNo ,
        address: order.deliveryAddress ,
        latitude: order.deliveryLatitude ,
        longitude: order.deliveryLongitude,
      }
    });
  } catch (err) {
    console.error("Delivery info error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;

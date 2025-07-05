const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

// JWT Token Auth middleware
const authToken = require("../../middleware/authToken")


const ORDER_DB = path.join(__dirname, "../../db/orders.json");

// Read orders DB
const readOrders = async () => JSON.parse(await fs.readFile(ORDER_DB, "utf-8"));

// ===========================================================================
// GET /api/driver/order/pending/:driverId
// Returns a pending (new) order assigned to the driver
// ===========================================================================
router.get("/order/pending/:driverId",authToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const orders = await readOrders();
    const newOrder = orders.find(order => order.driverId === driverId && order.status === "pending");

    if (!newOrder) {
      return res.status(404).json({
        success: false,
        message: "No new orders assigned to this driver",
      });
    }

    return res.status(200).json({
        success:true,
        message:"New order found",
        data:{
            orderId:newOrder.orderId,
            distanceKm: newOrder.distanceKm,
            amount: newOrder.amount,
        }
    })
  } catch (err) {
    console.error("Pending order fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
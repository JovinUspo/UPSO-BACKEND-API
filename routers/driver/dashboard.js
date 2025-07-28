const express = require("express");
const router = express.Router();
const authToken = require("../../middleware/authToken");

const Driver = require("../../models/Driver");
const Order = require("../../models/Order");

// =============================================================================
// GET /api/driver/dashboard/
// Returns driver profile summary, status, and recent completed orders.
// =============================================================================

router.get("/dashboard", authToken, async (req, res) => {
  try {

    // Fetch driver by custom `id` field (not _id)
    const driver = await Driver.findOne({ id: req.id });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Fetch completed orders for the driver
    const completedOrders = await Order.find({
      status: "completed",
    }).select("distanceKm amount id");
    
    const newOrders = await Order.find({
      status:"pending"
    }).select("distanceKm amount")
    let currentStatus = "Waiting for Orders"

    if (driver.activeStatus === "inactive"){
      currentStatus = "Driver Inactive"
    }else if(newOrders.length > 0){
      currentStatus = "New Order Received"
    }

    return res.status(200).json({
      success: true,
      data: {
        name: driver.name,
        status: driver.activeStatus,
        currentStatus: currentStatus,
        completedOrders,
        newOrders
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

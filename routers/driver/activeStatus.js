const express = require("express");
const router = express.Router();
const authToken = require("../../middleware/authToken");

const Driver = require("../../models/Driver");
const Order = require("../../models/Order");

// =============================================================================
// GET /api/driver/active-status/
// Switch Active status - Active or Inactive
// =============================================================================

router.get("/active-status", authToken, async (req, res) => {
  try {
        // Fetch driver by custom `id` field (not _id)
        const driver = await Driver.findOne({ id: req.id });
    
        if (!driver) {
          return res.status(404).json({
            success: false,
            message: "Driver not found",
          });
        }

        //toggle active status
        driver.activeStatus = driver.activeStatus === 'active'? 'inactive': 'active';
        driver.save()

        return res.status(200).json({
            success:true,
            message: `Driver status updated to ${driver.activeStatus}`,
            activeStatus:driver.activeStatus
        })
  } catch (error) {
    console.error("Dashboard error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;

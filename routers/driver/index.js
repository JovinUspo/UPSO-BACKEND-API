const express = require("express");
const router = express.Router();

// KYC Verify
router.use(require("./Register"));
router.use(require("./idProof"));

router.use(require("./login"));
router.use(require("./logout"));
router.use(require("./verifyOtp"));
router.use(require("./refresh"));

router.use(require("./dashboard"));
router.use(require("./activeStatus"));
router.use(require("./getOrder"));
router.use(require("./respondOrder"));
router.use(require("./pickup"));
router.use(require("./itemsCollected"));
router.use(require("./getItemsToCollect"));
router.use(require("./deliveryInfo"));
router.use(require("./deliveryReached"));
router.use(require("./deliverySummary"));
router.use(require("./earnings"));
router.use(require("./profile"));


module.exports = router;

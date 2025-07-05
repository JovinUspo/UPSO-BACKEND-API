const express = require("express");
const router = express.Router();

router.use(require("./signup"));
router.use(require("./login"));
router.use(require("./logout"));
router.use(require("./refresh"));
router.use(require("./sendOtp"));
router.use(require("./verifyOtp"));
router.use(require("./shopInfo"));
router.use(require("./addProduct"));

module.exports = router;

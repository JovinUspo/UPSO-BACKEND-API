const express = require("express");
const router = express.Router();

router.use(require("./signup"));
router.use(require("./login"));
router.use(require("./sendOtp"));
router.use(require("./verifyOtp"));
router.use(require("./logout"));
router.use(require("./location"));
router.use(require("./refresh"));

module.exports = router;

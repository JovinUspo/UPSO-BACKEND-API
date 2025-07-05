const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");

const USERS_FILE = path.join(__dirname, "../../db/users.json");

const readUsers = async () =>
  JSON.parse(await fs.readFile(USERS_FILE, "utf8"));

const writeUsers = async (data) =>
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));

router.post("/send-otp", async (req, res) => {
  const mobile = (req.body.mobile || "").trim();

  if (!mobile) {
    return res.status(400).json({
      success: false,
      message: "Mobile number is required",
    });
  }

  const users = await readUsers();
  const user = users.find((u) => u.mobile === mobile);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  user.otp = otp;
  user.otpExpiresAt = expiresAt;

  await writeUsers(users);

  console.log(`[MOCK] OTP for ${mobile} (user): ${otp}`);

  return res.status(200).json({
    success: true,
    message: `OTP sent successfully (mocked for user)`,
  });
});

module.exports = router;

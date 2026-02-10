// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

router.post("/send-otp", async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ success: false });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  await global.db.query(
    "INSERT INTO otp_requests (mobile, otp, expires_at) VALUES (?, ?, ?)",
    [mobile, otp, expires]
  );

  await client.messages.create({
    body: `Your BizzMark OTP is ${otp}`,
    from: process.env.TWILIO_PHONE,
    to: `+91${mobile}`,
  });

  res.json({ success: true, message: "OTP sent" });
});

module.exports = router;


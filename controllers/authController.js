const db = global.db;
const crypto = require("crypto");

/* ===============================
   SEND OTP
================================ */
exports.sendOtp = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile || mobile.length < 10) {
    return res.status(400).json({ success: false, message: "Invalid mobile number" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  await db.query(
    `INSERT INTO otp_verifications (mobile, otp, expires_at)
     VALUES (?, ?, ?)`,
    [mobile, otp, expiresAt]
  );

  // 👉 SEND OTP HERE (SMS API)
  console.log("OTP for testing:", otp);

  res.json({
    success: true,
    message: "OTP sent successfully"
  });
};

/* ===============================
   VERIFY OTP
================================ */
exports.verifyOtp = async (req, res) => {
  const { mobile, otp } = req.body;

  const [rows] = await db.query(
    `SELECT * FROM otp_verifications
     WHERE mobile=? AND otp=? AND verified=0
     ORDER BY id DESC LIMIT 1`,
    [mobile, otp]
  );

  if (!rows.length) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  const record = rows[0];

  if (new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ success: false, message: "OTP expired" });
  }

  await db.query(
    `UPDATE otp_verifications SET verified=1 WHERE id=?`,
    [record.id]
  );

  // 👉 Fetch / create company here
  const company = {
    mobile,
    company_name: "BizMark User"
  };

  res.json({
    success: true,
    message: "Login successful",
    company
  });
};

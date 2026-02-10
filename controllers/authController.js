const db = require("../config/db");
const bcrypt = require("bcryptjs");
const sendSMS = require("../utils/sendSMS");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM companies WHERE email = ?",
      [email]
    );

    if (rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    const company = rows[0];

    const match = await bcrypt.compare(password, company.password);
    if (!match)
      return res.status(400).json({ message: "Invalid password" });

    // generate otp
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000;

    await db.query(
      "UPDATE companies SET otp = ?, otp_expiry = ? WHERE email = ?",
      [otp, expiry, email]
    );

    // ✅ send sms
    await sendSMS(company.phone, otp);

    res.json({ success: true, message: "OTP sent to mobile" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM companies WHERE email = ?",
      [email]
    );

    if (rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    const company = rows[0];

    if (company.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (company.otp_expiry < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    await db.query(
      "UPDATE companies SET otp = NULL, otp_expiry = NULL WHERE email = ?",
      [email]
    );

    res.json({
      success: true,
      company,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

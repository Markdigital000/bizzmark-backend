const bcrypt = require("bcryptjs");
const db = require("../config/db");

// ================= VERIFY EMAIL =================
exports.verifyEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ success: false, message: "Email required" });
  }

  try {
    const [user] = await db.query(
      "SELECT * FROM companies WHERE email=?",
      [email]
    );

    if (user.length === 0) {
      return res.json({ success: false, message: "Email not registered" });
    }

    return res.json({ success: true, message: "Email verified" });

  } catch (err) {
    console.log(err);
    return res.json({ success: false, message: "Server error" });
  }
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "All fields required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "UPDATE companies SET password=? WHERE email=?",
      [hashedPassword, email]
    );

    return res.json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (err) {
    console.log(err);
    return res.json({ success: false, message: "Server error" });
  }
};

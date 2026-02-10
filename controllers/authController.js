const otpStore = new Map();

exports.sendOtp = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile || mobile.length !== 10) {
    return res.status(400).json({ message: "Invalid mobile" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore.set(mobile, otp);

  console.log("OTP:", otp); // replace with SMS gateway later

  res.json({ success: true, message: "OTP sent" });
};

exports.verifyOtp = async (req, res) => {
  const { mobile, otp } = req.body;

  if (otpStore.get(mobile) != otp) {
    return res.status(401).json({ message: "Invalid OTP" });
  }

  otpStore.delete(mobile);

  // fetch or create company
  const company = {
    company_name: "BizzMark User",
    mobile,
  };

  res.json({ success: true, company });
};

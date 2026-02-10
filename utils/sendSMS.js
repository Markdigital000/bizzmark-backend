const axios = require("axios");

const sendSMS = async (phone, otp) => {
  try {
    await axios.get(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.SMS_API_KEY}&route=otp&variables_values=${otp}&flash=0&numbers=${phone}`
    );

    console.log("✅ OTP SMS sent");
  } catch (err) {
    console.log("❌ SMS error:", err.response?.data || err.message);
  }
};

module.exports = sendSMS;

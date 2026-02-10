const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  email: String,
  password: String,

  otp: String,
  otpExpiry: Date,
});

module.exports = mongoose.model("Company", companySchema);

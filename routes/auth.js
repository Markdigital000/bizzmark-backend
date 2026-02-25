const express = require("express");
const router = express.Router();

const {
  verifyEmail,
  resetPassword
} = require("../controllers/authController");

// ✅ ROUTES
router.post("/verify-email", verifyEmail);
router.post("/reset-password", resetPassword);

module.exports = router;

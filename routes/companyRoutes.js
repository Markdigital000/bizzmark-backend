const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
 
const {
  registerCompany,
  loginCompany
} = require("../controllers/companyController");
 
// AUTH
router.post("/register", upload.single("photoUrl"), registerCompany);
router.post("/login", loginCompany);

 
module.exports = router;

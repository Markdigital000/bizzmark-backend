const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  registerCompany,
  loginCompany,
} = require("../controllers/companyController");
const { updateCompanyProfile } = require("../controllers/companyController");

router.post("/register", upload.single("photoUrl"), registerCompany);
router.post("/login", loginCompany);

router.put("/profile/:id", updateCompanyProfile);

module.exports = router;

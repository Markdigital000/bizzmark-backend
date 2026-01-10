const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
 
const {
  registerCompany,
  loginCompany,
  getAllCompanies,
  getCompanyById,
  getCompanyByCode,
  searchCompanies,
  updateCompanyProfile,
} = require("../controllers/companyController");
 
// AUTH
router.post("/register", upload.single("photoUrl"), registerCompany);


router.post("/login", loginCompany);
 
// UPDATE
router.put("/profile/:id", upload.single("photoUrl"), updateCompanyProfile);
 
// FETCH (order matters)
router.get("/search", searchCompanies);
router.get("/code/:code", getCompanyByCode);
router.get("/id/:id", getCompanyById);
router.get("/", getAllCompanies); // ✅ FIXED: Removed "/api/companies/"
 
module.exports = router;

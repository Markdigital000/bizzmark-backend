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



} = require("../controllers/companyController");
const { updateCompanyProfile } = require("../controllers/companyController");

router.post("/register", upload.single("photoUrl"), registerCompany);
router.post("/login", loginCompany);

router.put("/profile/:id", updateCompanyProfile);




/* SHOW / FETCH */
router.get("/", getAllCompanies);
router.get("/id/:id", getCompanyById);
router.get("/code/:code", getCompanyByCode);
router.get("/search", searchCompanies);

module.exports = router;

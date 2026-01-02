const pool = require("../config/db");
const bcrypt = require("bcrypt");

/* ================= GENERATE COMPANY CODE ================= */
const generateCompanyCode = async () => {
  let code, exists = true;

  while (exists) {
    code = `CMP-${new Date().getFullYear()}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    const [rows] = await pool.query(
      "SELECT 1 FROM companies WHERE company_code = ?",
      [code]
    );
    exists = rows.length > 0;
  }
  return code;
};

/* ================= REGISTER ================= */
exports.registerCompany = async (req, res) => {
  try {
    const {
      companyName,
      email,
      password,
      contactNumber,
      role,
      address,
      description,
    } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password required" });
    }

    const [exists] = await pool.query(
      "SELECT 1 FROM companies WHERE email = ?",
      [email]
    );

    if (exists.length > 0) {
      return res.status(400).json({ success: false, message: "Company already exists" });
    }

    const companycode = await generateCompanyCode();
    const hashedPassword = await bcrypt.hash(password, 10);
    const photoUrl = req.file ? req.file.filename : null;

    await pool.query(
      `INSERT INTO companies
      (company_name, company_code, email, password, contact_number, photo_url, role, address, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyName,
        companycode,
        email,
        hashedPassword,
        contactNumber,
        photoUrl,
        role,
        address,
        description,
      ]
    );

    res.json({ success: true, message: "Registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

/* ================= LOGIN ================= */
exports.loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      "SELECT * FROM companies WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false });
    }

    const company = rows[0];
    const match = await bcrypt.compare(password, company.password);

    if (!match) {
      return res.status(401).json({ success: false });
    }

    res.json({ success: true, company });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

/* ================= GET ALL COMPANIES ================= */
exports.getAllCompanies = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, company_name, company_code, email, contact_number,
       photo_url, address, city, state, country, role, description, created_at
       FROM companies ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      count: rows.length,
      companies: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

/* ================= GET COMPANY BY ID ================= */
exports.getCompanyById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM companies WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false });
    }

    res.json({ success: true, company: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

/* ================= SEARCH ================= */
exports.searchCompanies = async (req, res) => {
  try {
    const { city, keyword } = req.query;

    const [rows] = await pool.query(
      `SELECT * FROM companies
       WHERE (? IS NULL OR city LIKE CONCAT('%', ?, '%'))
       AND (? IS NULL OR company_name LIKE CONCAT('%', ?, '%'))`,
      [city, city, keyword, keyword]
    );

    res.json({ success: true, companies: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

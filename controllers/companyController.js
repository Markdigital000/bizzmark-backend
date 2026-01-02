const pool = require("../config/db");
const bcrypt = require("bcrypt");

/* ================= GENERATE COMPANY CODE ================= */
const generateCompanyCode = async () => {
  let code;
  let exists = true;

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
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const [existing] = await pool.query(
      "SELECT 1 FROM companies WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Company already registered",
      });
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

    res.json({
      success: true,
      message: "Registration successful. Please login.",
    });
  } catch (err) {
    console.error("REGISTER ERROR 👉", err);
    res.status(500).json({ success: false, message: err.message });
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
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const company = rows[0];

    const isMatch = await bcrypt.compare(password, company.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    res.json({
      success: true,
      company: {
        id: company.id,
        company_name: company.company_name,
        company_code: company.company_code,
        email: company.email,
        contact_number: company.contact_number,
        photo_url: company.photo_url,
        address: company.address,
        city: company.city,
        state: company.state,
        country: company.country,
        role: company.role,
        description: company.description,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR 👉", err);
    res.status(500).json({ success: false });
  }
};

/* ================= UPDATE PROFILE ================= */
exports.updateCompanyProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      company_name,
      contact_number,
      address,
      city,
      state,
      country,
      photo_url,
    } = req.body;

    await pool.query(
      `UPDATE companies SET
        company_name = ?,
        contact_number = ?,
        address = ?,
        city = ?,
        state = ?,
        country = ?,
        photo_url = ?
       WHERE id = ?`,
      [
        company_name,
        contact_number,
        address,
        city,
        state,
        country,
        photo_url,
        id,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE ERROR 👉", err);
    res.status(500).json({ success: false });
  }
};

/* ================= GET ALL COMPANIES ================= */
exports.getAllCompanies = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        id,
        company_name,
        company_code,
        email,
        contact_number,
        photo_url,
        address,
        city,
        state,
        country,
        role,
        description,
        created_at
      FROM companies
      ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      count: rows.length,
      companies: rows,
    });
  } catch (err) {
    console.error("GET ALL ERROR 👉", err);
    res.status(500).json({ success: false });
  }
};

/* ================= GET BY ID ================= */
exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      "SELECT * FROM companies WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.json({ success: true, company: rows[0] });
  } catch (err) {
    console.error("GET BY ID ERROR 👉", err);
    res.status(500).json({ success: false });
  }
};

/* ================= GET BY CODE ================= */
exports.getCompanyByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const [rows] = await pool.query(
      "SELECT * FROM companies WHERE company_code = ?",
      [code]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.json({ success: true, company: rows[0] });
  } catch (err) {
    console.error("GET BY CODE ERROR 👉", err);
    res.status(500).json({ success: false });
  }
};

/* ================= SEARCH ================= */
exports.searchCompanies = async (req, res) => {
  try {
    const { city, keyword } = req.query;

    const [rows] = await pool.query(
      `SELECT 
        id,
        company_name,
        company_code,
        photo_url,
        address,
        city,
        state,
        country,
        role,
        description
      FROM companies
      WHERE (? IS NULL OR city LIKE CONCAT('%', ?, '%'))
      AND (? IS NULL OR company_name LIKE CONCAT('%', ?, '%'))
      ORDER BY created_at DESC`,
      [city || null, city || null, keyword || null, keyword || null]
    );

    res.json({
      success: true,
      count: rows.length,
      companies: rows,
    });
  } catch (err) {
    console.error("SEARCH ERROR 👉", err);
    res.status(500).json({ success: false });
  }
};

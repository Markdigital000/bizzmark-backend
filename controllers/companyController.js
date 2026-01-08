const pool = require("../config/db");
const bcrypt = require("bcrypt");

/* ================= GENERATE COMPANY CODE ================= */
const generateCompanyCode = async () => {
  let exists = true;
  let code;

  while (exists) {
    code = `CMP-${new Date().getFullYear()}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    const [rows] = await pool.query(
      "SELECT id FROM companies WHERE company_code = ?",
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
      "SELECT id FROM companies WHERE email = ?",
      [email]
    );

    if (exists.length > 0) {
      return res.status(400).json({ success: false, message: "Company exists" });
    }

    const companyCode = await generateCompanyCode();
    const hashedPassword = await bcrypt.hash(password, 10);
    const photoUrl = req.file ? req.file.filename : null;

    await pool.query(
      `INSERT INTO companies 
      (company_name, company_code, email, password, contact_number, photo_url, role, address, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyName,
        companyCode,
        email,
        hashedPassword,
        contactNumber,
        photoUrl,
        role,
        address,
        description,
      ]
    );

    res.json({ success: true, message: "Registration successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

/* ================= LOGIN COMPANY ================= */
exports.loginCompany = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // identifier = email OR company_code
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Company Code and password are required"
      });
    }

    // Find company by email OR company_code
    const [rows] = await pool.query(
      `SELECT id, name, email, company_code, password, status 
       FROM companies 
       WHERE email = ? OR company_code = ?
       LIMIT 1`,
      [identifier, identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/company code or password"
      });
    }

    const company = rows[0];

    // Optional: block inactive companies
    if (company.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Account is inactive. Contact support."
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, company.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/company code or password"
      });
    }

    // Remove password before sending response
    delete company.password;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      company
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login"
    });
  }
};

/* ================= GET ALL COMPANIES ================= */
exports.getAllCompanies = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        id, company_name, company_code, email,
        contact_number, photo_url, address,
        city, state, country, role, description, created_at
      FROM companies
      ORDER BY created_at DESC`
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

/* ================= GET BY ID ================= */
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
    res.status(500).json({ success: false });
  }
};

/* ================= GET BY CODE ================= */
exports.getCompanyByCode = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM companies WHERE company_code = ?",
      [req.params.code]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false });
    }

    res.json({ success: true, company: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

/* ================= SEARCH ================= */
exports.searchCompanies = async (req, res) => {
  try {
    const { city = "", keyword = "" } = req.query;

    const [rows] = await pool.query(
      `SELECT * FROM companies
       WHERE city LIKE ? AND company_name LIKE ?
       ORDER BY created_at DESC`,
      [`%${city}%`, `%${keyword}%`]
    );

    res.json({ success: true, count: rows.length, companies: rows });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};




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

    res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

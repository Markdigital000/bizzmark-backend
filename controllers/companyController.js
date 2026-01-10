const db = require("../config/db");
const bcrypt = require("bcrypt");

/* ================= REGISTER ================= */
const registerCompany = async (req, res) => {
  try {
    const {
      company_name,
      company_code,
      email,
      contact_number,
      address,
      role,
      description,
      terms_agreed,
      password,
      city,
      state,
      country
    } = req.body;

    if (!company_name || !company_code || !email || !contact_number || !address || !password) {
      return res.status(400).json({ success: false, message: "All required fields must be filled" });
    }

    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO companies (
        company_name, company_code, email, contact_number,
        address, city, state, country,
        role, description, terms_agreed, photo_url, password
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company_name,
        company_code,
        email,
        contact_number,
        address,
        city || null,
        state || null,
        country || null,
        role || null,
        description || null,
        terms_agreed ? 1 : 0,
        photo_url,
        hashedPassword
      ]
    );

    res.json({ success: true, message: "Registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= LOGIN ================= */
const loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query("SELECT * FROM companies WHERE email = ?", [email]);
    if (!rows.length) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) return res.status(401).json({ success: false, message: "Invalid credentials" });

    delete rows[0].password;
    res.json({ success: true, company: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

/* ================= UPDATE ================= */
const updateCompanyProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (req.file) data.photo_url = `/uploads/${req.file.filename}`;

    const keys = Object.keys(data);
    if (!keys.length) return res.status(400).json({ success: false, message: "No data to update" });

    const sql = keys.map(k => `${k}=?`).join(",");
    const values = [...Object.values(data), id];

    await db.query(`UPDATE companies SET ${sql} WHERE id=?`, values);

    res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

/* ================= FETCH ================= */
const getAllCompanies = async (req, res) => {
  const [rows] = await db.query("SELECT * FROM companies");
  res.json({ success: true, data: rows });
};

const getCompanyById = async (req, res) => {
  const [rows] = await db.query("SELECT * FROM companies WHERE id=?", [req.params.id]);
  res.json({ success: true, data: rows[0] });
};

const getCompanyByCode = async (req, res) => {
  const [rows] = await db.query("SELECT * FROM companies WHERE company_code=?", [req.params.code]);
  res.json({ success: true, data: rows[0] });
};

const searchCompanies = async (req, res) => {
  const q = `%${req.query.q}%`;
  const [rows] = await db.query("SELECT * FROM companies WHERE company_name LIKE ?", [q]);
  res.json({ success: true, data: rows });
};

/* ================= EXPORT ================= */
module.exports = {
  registerCompany,
  loginCompany,
  updateCompanyProfile,
  getAllCompanies,
  getCompanyById,
  getCompanyByCode,
  searchCompanies
};

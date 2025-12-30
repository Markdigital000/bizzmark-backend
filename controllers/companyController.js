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

    const check = await pool.query(
      "SELECT 1 FROM companies WHERE company_code = $1",
      [code]
    );
    exists = check.rowCount > 0;
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

    const exists = await pool.query(
      "SELECT 1 FROM companies WHERE email = $1",
      [email]
    );

    if (exists.rowCount > 0) {
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
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
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ================= LOGIN ================= */
exports.loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM companies WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const company = result.rows[0];

    if (!company.password) {
      return res.status(500).json({
        success: false,
        message: "Password not set. Please re-register.",
      });
    }

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
      photo_url, // base64 OR filename
    } = req.body;

    const result = await pool.query(
      `UPDATE companies SET
        company_name = $1,
        contact_number = $2,
        address = $3,
        city = $4,
        state = $5,
        country = $6,
        photo_url = $7
       WHERE id = $8
       RETURNING *`,
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

    res.json({
      success: true,
      company: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

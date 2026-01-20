const db = require("../config/db");
const bcrypt = require("bcrypt");
 
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
      password
    } = req.body;

    if (!company_name || !company_code || !email || !contact_number || !address || !password) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled"
      });
    }

    // ✅ HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    const [existingEmail] = await global.db.query(
      "SELECT id FROM companies WHERE email = ?",
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const [result] = await global.db.query(
      `INSERT INTO companies
      (company_name, company_code, email, contact_number, address, role, description, terms_agreed, photo_url, password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company_name,
        company_code,
        email,
        contact_number,
        address,
        role || null,
        description || null,
        terms_agreed ? 1 : 0,
        photo_url,
        hashedPassword // ✅ STORE HASH
      ]
    );

    res.status(201).json({
      success: true,
      message: "Company registered successfully",
      id: result.insertId
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
 
module.exports = { registerCompany };
 
 
// const bcrypt = require("bcrypt");
 
const loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;
 
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }
 
    const [companies] = await global.db.query(
      "SELECT * FROM companies WHERE email = ?",
      [email]
    );
 
    if (companies.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
 
    const company = companies[0];
 
    // 🔐 bcrypt compare
    const isMatch = await bcrypt.compare(password, company.password);
 
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
 
    // 🔥 password hide
    delete company.password;
 
    res.json({
      success: true,
      message: "Login successful",
      company,
    });
 
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};
 
 
 
const getAllCompanies = async (req, res) => {
    try {
        const [companies] = await global.db.query(
            'SELECT * FROM companies ORDER BY created_at DESC'
        );
 
        res.json({
            success: true,
            count: companies.length,
            data: companies
        });
 
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch companies',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
 
const getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;
 
        const [companies] = await global.db.query(
            'SELECT * FROM companies WHERE id = ?',
            [id]
        );
 
        if (companies.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }
 
        res.json({
            success: true,
            data: companies[0]
        });
 
    } catch (error) {
        console.error('Get company by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch company',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
 
const getCompanyByCode = async (req, res) => {
    try {
        const { code } = req.params;
 
        const [companies] = await global.db.query(
            'SELECT * FROM companies WHERE company_code = ?',
            [code]
        );
 
        if (companies.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }
 
        res.json({
            success: true,
            data: companies[0]
        });
 
    } catch (error) {
        console.error('Get company by code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch company',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
 
const searchCompanies = async (req, res) => {
    try {
        const { q, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
 
        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }
 
        const searchTerm = `%${q}%`;
       
        // Search in multiple fields
        const [companies] = await global.db.query(
            `SELECT * FROM companies
            WHERE company_name LIKE ?
               OR company_code LIKE ?
               OR email LIKE ?
               OR role LIKE ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`,
            [searchTerm, searchTerm, searchTerm, searchTerm, parseInt(limit), offset]
        );
 
        // Get total count for pagination
        const [countResult] = await global.db.query(
            `SELECT COUNT(*) as total FROM companies
            WHERE company_name LIKE ?
               OR company_code LIKE ?
               OR email LIKE ?
               OR role LIKE ?`,
            [searchTerm, searchTerm, searchTerm, searchTerm]
        );
 
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);
 
        res.json({
            success: true,
            data: companies,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
 
    } catch (error) {
        console.error('Search companies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search companies',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
 
const updateCompanyProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const updateFields = req.body;
 
        // Check if company exists
        const [existingCompany] = await global.db.query(
            'SELECT id FROM companies WHERE id = ?',
            [id]
        );
 
        if (existingCompany.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }
 
        // Handle file upload if exists
        if (req.file) {
            updateFields.photo_url = `/uploads/${req.file.filename}`;
        }
 
        // Remove empty fields and id field
        Object.keys(updateFields).forEach(key => {
            if (updateFields[key] === '' || key === 'id') {
                delete updateFields[key];
            }
        });
 
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
 
        // Build dynamic update query
        const setClause = Object.keys(updateFields)
            .map(key => `${key} = ?`)
            .join(', ');
       
        const values = Object.values(updateFields);
        values.push(id); // For WHERE clause
 
        await global.db.query(
            `UPDATE companies SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );
 
        // Get updated company
        const [updatedCompany] = await global.db.query(
            'SELECT * FROM companies WHERE id = ?',
            [id]
        );
 
        res.json({
            success: true,
            message: 'Company profile updated successfully',
            data: updatedCompany[0]
        });
 
    } catch (error) {
        console.error('Update company error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update company profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
 
module.exports = {
    registerCompany,
    loginCompany,
    getAllCompanies,
    getCompanyById,
    getCompanyByCode,
    searchCompanies,
    updateCompanyProfile
};

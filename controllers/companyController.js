// companyController.js - Updated with database queries

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
            password // Added password
        } = req.body;

        const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

        // Validate required fields
        if (!company_name || !company_code || !email || !contact_number || !address || !password) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be filled'
            });
        }

        // Check if company code already exists
        const [existingCode] = await global.db.query(
            'SELECT id FROM companies WHERE company_code = ?',
            [company_code]
        );

        if (existingCode.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Company code already exists'
            });
        }

        // Check if email already exists
        const [existingEmail] = await global.db.query(
            'SELECT id FROM companies WHERE email = ?',
            [email]
        );

        if (existingEmail.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Insert new company
        const [result] = await global.db.query(
            `INSERT INTO companies 
            (company_name, company_code, email, contact_number, address, 
             role, description, terms_agreed, photo_url, password) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                company_name,
                company_code,
                email,
                contact_number,
                address,
                role || null,
                description || null,
                terms_agreed || false,
                photo_url,
                password // Added password
            ]
        );

        // Get the created company (without password)
        const [company] = await global.db.query(
            'SELECT id, company_name, company_code, email, contact_number, address, role, photo_url, created_at FROM companies WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Company registered successfully',
            data: company[0]
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register company',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const loginCompany = async (req, res) => {
    try {
        const { email, company_code, password } = req.body; // Added password

        if ((!email && !company_code) || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email/company code and password'
            });
        }

        let query = 'SELECT * FROM companies WHERE ';
        let params = [];

        if (email && company_code) {
            query += 'email = ? AND company_code = ?';
            params = [email, company_code];
        } else if (email) {
            query += 'email = ?';
            params = [email];
        } else {
            query += 'company_code = ?';
            params = [company_code];
        }

        const [companies] = await global.db.query(query, params);

        if (companies.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const company = companies[0];

        // Simple password check (if you have password field in database)
        // If you don't have password field, remove this check
        if (password && company.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        // Remove password from response
        delete company.password;

        res.json({
            success: true,
            message: 'Login successful',
            company: company, // Changed from 'data' to 'company'
            data: company // Keep both for compatibility
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ======================
// CONFIGURATION
// ======================

// Database Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'w63935738_bitmark',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Server Configuration
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // IMPORTANT: Use 0.0.0.0 for external access

// ======================
// MIDDLEWARE
// ======================
app.use(cors({
    origin: ['http://localhost:3000', 'http://srv1235061.hstgr.cloud', 'https://srv1235061.hstgr.cloud:5000'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// DATABASE CONNECTION
// ======================
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.log('⚠️  Continuing without database connection...');
    } else {
        console.log('✅ Database connected successfully');
        connection.release();
    }
});

// ======================
// API ROUTES
// ======================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        server: `http://${HOST}:${PORT}`,
        accessibleAt: `http://srv1235061.hstgr.cloud:${PORT}`,
        timestamp: new Date().toISOString(),
        database: dbConfig.database,
        databaseStatus: pool._freeConnections.length > 0 ? 'connected' : 'disconnected'
    });
});

// Companies endpoint (from your requirement)
app.get('/api/companies', async (req, res) => {
    try {
        const [rows] = await pool.promise().query('SELECT * FROM companies LIMIT 100');
        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch companies'
        });
    }
});

// Example: Get company by ID
app.get('/api/companies/:id', async (req, res) => {
    try {
        const [rows] = await pool.promise().query('SELECT * FROM companies WHERE id = ?', [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Example: Create company
app.post('/api/companies', async (req, res) => {
    try {
        const { name, email, website } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Company name is required'
            });
        }
        
        const [result] = await pool.promise().query(
            'INSERT INTO companies (name, email, website) VALUES (?, ?, ?)',
            [name, email || null, website || null]
        );
        
        res.status(201).json({
            success: true,
            message: 'Company created successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ======================
// ERROR HANDLING
// ======================

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ======================
// START SERVER
// ======================
const server = app.listen(PORT, HOST, () => {
    console.log(`
╔══════════════════════════════════════════╗
║          SERVER STARTED SUCCESSFULLY     ║
╚══════════════════════════════════════════╝
    
✅ Server running on: http://${HOST}:${PORT}
🌐 Public URL:        http://srv1235061.hstgr.cloud:${PORT}
📡 API Base URL:      http://srv1235061.hstgr.cloud:${PORT}/api

📊 API Endpoints:
   • GET  /api/health       - Health check
   • GET  /api/companies    - Get all companies
   • GET  /api/companies/:id - Get company by ID
   • POST /api/companies    - Create new company

📊 Database: ${dbConfig.database}
📊 Database Host: ${dbConfig.host}

⏰ Started at: ${new Date().toLocaleString()}
🚀 Ready to accept connections...
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        pool.end();
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        pool.end();
        process.exit(0);
    });
});

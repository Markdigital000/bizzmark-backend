// server.js - Updated to use companyRoutes.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
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
// DATABASE CONNECTION (global pool for controllers)
// ======================
const pool = mysql.createPool(dbConfig);

// Make the pool available globally (for controllers)
global.db = pool.promise();

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
// MIDDLEWARE
// ======================
// Fix CORS - remove HTTPS for localhost
app.use(cors({
    origin: ['http://localhost:5000', 'http://localhost:5173', 'http://srv1235061.hstgr.cloud', 'http://srv1235061.hstgr.cloud:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ======================
// IMPORT ROUTES
// ======================
const companyRoutes = require('./routes/companyRoutes');

// ======================
// API ROUTES
// ======================



// Add before your routes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});


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









// Use company routes
app.use('/api', companyRoutes);

// ======================
// ERROR HANDLING
// ======================

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        availableRoutes: [
            'POST /api/companies/register',
            'POST /api/companies/login',
            'PUT /api/companies/profile/:id',
            'GET /api/companies/search',
            'GET /api/companies/code/:code',
            'GET /api/companies/id/:id',
            'GET /api/companies/',
            'GET /api/health'
        ]
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

📊 AVAILABLE ENDPOINTS:
   • POST   /api/companies/register     - Register new company
   • POST   /api/companies/login        - Company login
   • PUT    /api/companies/profile/:id  - Update company profile
   • GET    /api/companies/search       - Search companies
   • GET    /api/companies/code/:code   - Get company by code
   • GET    /api/companies/id/:id       - Get company by ID
   • GET    /api/companies/             - Get all companies
   • GET    /api/health                 - Health check

📊 Database: ${dbConfig.database}
📊 Database Host: ${dbConfig.host}
📊 Upload Directory: ${path.join(__dirname, 'uploads')}

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

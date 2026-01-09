const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();
 
// 🔹 IMPORT ROUTES
const companyRoutes = require("./routes/companyRoutes");
 
const app = express();
 
// ======================
// DATABASE CONFIG
// ======================
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};
 
// ======================
// SERVER CONFIG
// ======================
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";
 
// ======================
// MIDDLEWARE
// ======================
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://bizzmarkindia.com/",
      "https://bizzmarkindia.com/login",
      "http://srv1235061.hstgr.cloud",
      "http://srv1235061.hstgr.cloud:3000",
      
    ],
    credentials: true,
  })
);
 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
// 🔹 STATIC UPLOADS
app.use("/uploads", express.static("uploads"));
 
// ======================
// DATABASE CONNECTION
// ======================
const pool = mysql.createPool(dbConfig);
 
// 🔹 MAKE POOL GLOBAL (IMPORTANT)
global.db = pool.promise();
 
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Database connected successfully");
    connection.release();
  }
});
 
// ======================
// API ROUTES
// ======================
 
// 🔹 COMPANY ROUTES
app.use("/api/companies", companyRoutes);
 
// 🔹 HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    server: `http://${HOST}:${PORT}`,
    database: dbConfig.database,
    time: new Date().toISOString(),
  });
});
 
// ======================
// ERROR HANDLING
// ======================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});
 
// ======================
// START SERVER
// ======================
const server = app.listen(PORT, HOST, () => {
  console.log(`
🚀 SERVER STARTED SUCCESSFULLY
 
Server: http://${HOST}:${PORT}
Public: http://srv1235061.hstgr.cloud:${PORT}
API:    http://srv1235061.hstgr.cloud:${PORT}/api
 
Endpoints:
POST   /api/companies/register
POST   /api/companies/login
GET    /api/companies
GET    /api/companies/id/:id
GET    /api/companies/code/:code
GET    /api/companies/search?q=
  `);
});
 
// ======================
// GRACEFUL SHUTDOWN
// ======================
process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down...");
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});
 

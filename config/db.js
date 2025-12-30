const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // REQUIRED for Render PostgreSQL
  },
});

// Test database connection
pool.query("SELECT 1")
  .then(() => {
    console.log("✅ PostgreSQL connected successfully");
  })
  .catch((err) => {
    console.error("❌ PostgreSQL connection error:", err);
  });

module.exports = pool;

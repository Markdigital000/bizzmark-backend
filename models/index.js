const pool = require("../config/db"); // Ensure this is the correct path
const Clinics = require("./clinic"); // Import the Clinics model

const db = {};
db.pool = pool;
db.Clinics = Clinics; // ✅ Ensure Clinics model is exported correctly

module.exports = db;

// ✅ Uncomment this during debugging to check if syncing works
pool.sync()
    .then(() => console.log("✅ Database synced successfully"))
    .catch(err => console.error("❌ Error syncing database:", err));


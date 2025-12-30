require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");

const companyRoutes = require("./routes/companyRoutes");


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse form data
const upload = multer(); // For parsing FormData
// Routes

app.use("/api/companies", companyRoutes);


console.log("✅ Database connection pool initialized.");

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

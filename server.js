require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");

require("./config/db"); // ✅ IMPORTANT: initialize DB connection

const companyRoutes = require("./routes/companyRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer();

// Routes
app.use("/api/companies", companyRoutes);

// Health check (recommended)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

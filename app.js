const express = require("express");
const cors = require("cors");
const staffRoutes = require("./routes/staffRoutes");

const app = express();
app.use(express.json());
app.use(cors());

// Use Routes
app.use("/api", staffRoutes);
app.use("/api/auth", require("./routes/authRoutes"));

// Start Server
app.listen(5000, () => {
    console.log("🚀 Server running on port 5000");
});

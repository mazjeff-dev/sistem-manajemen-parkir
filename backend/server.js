const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Memanggil koneksi database
require("./config/db");

const app = express();
const authRoutes = require("./routes/authRoutes");

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("API Sistem Manajemen Parkir Berjalan");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
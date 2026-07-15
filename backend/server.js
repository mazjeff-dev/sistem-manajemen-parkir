const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Memanggil koneksi database
const db = require("./config/db");

const app = express();
const authRoutes = require("./routes/authRoutes");
const jenisRoutes = require("./routes/jenisRoutes");
const kendaraanRoutes = require("./routes/kendaraanRoutes");
const parkirRoutes = require("./routes/parkirRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

app.use(cors());
app.use(express.json());

// Menyediakan akses statis ke file yang diupload (foto profile),
// tanpa ini foto profile tidak akan pernah bisa dimuat di frontend
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/jenis", jenisRoutes);
app.use("/api/kendaraan", kendaraanRoutes);
app.use("/api/parkir", parkirRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
    res.send("API Sistem Manajemen Parkir Berjalan");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
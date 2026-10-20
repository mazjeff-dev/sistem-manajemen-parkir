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
const laporanRoutes = require("./routes/laporanRoutes");
const profileRoutes = require("./routes/profileRoutes");
const adminRoutes = require("./routes/adminRoutes");
const anprRoutes = require("./routes/anprRoutes");

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
app.use("/api/laporan", laporanRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/anpr", anprRoutes);

app.get("/", (req, res) => {
    res.send("API Sistem Manajemen Parkir Berjalan");
});

// ===========================
// 404 handler untuk endpoint API yang tidak ada
// ===========================
app.use("/api", (req, res) => {
    res.status(404).json({
        message: "Endpoint tidak ditemukan"
    });
});

// ===========================
// Global error handler
// Sebelumnya tidak ada sama sekali, jadi error yang lolos dari
// middleware lain (contoh: multer menolak file lewat fileFilter,
// atau file melebihi limits.fileSize) akan jatuh ke default error
// handler Express dan dibalas sebagai halaman HTML, bukan JSON.
// Ini bikin frontend gagal saat memanggil response.json() karena
// bodinya bukan JSON valid. Middleware ini memastikan SEMUA error
// selalu dibalas sebagai JSON yang konsisten dengan endpoint lain,
// dan tidak membocorkan detail teknis (stack trace, dsb) ke client.
// ===========================
app.use((err, req, res, next) => {

    console.error("[Unhandled Error]", err);

    // Error spesifik dari Multer (upload file), contoh: ukuran file
    // melebihi batas atau format ditolak oleh fileFilter.
    if (err && (err.name === "MulterError" || err.message?.includes("Format foto") || err.message?.includes("Ekstensi file"))) {
        return res.status(400).json({
            message: err.message || "Gagal mengunggah file"
        });
    }

    res.status(500).json({
        message: "Terjadi kesalahan pada server"
    });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
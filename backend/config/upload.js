const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads", "profile");

// Pastikan folder upload ada
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Tipe file yang diizinkan, dipetakan dari mimetype -> ekstensi yang sah.
// Dulu validasi hanya mengecek mimetype yang dikirim browser, padahal
// mimetype itu gampang dipalsukan dari sisi client (misal file .php
// dikirim dengan header Content-Type: image/png). Sekarang ekstensi
// nama file asli juga divalidasi supaya harus konsisten dengan
// mimetype-nya, sebelum file disimpan ke disk.
const TIPE_DIIZINKAN = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"]
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Ekstensi diambil dari daftar yang diizinkan (bukan dari nama file
        // asli secara langsung), supaya nama file akhir tidak bisa disusupi
        // karakter aneh dari originalname yang dikontrol user.
        const ext = TIPE_DIIZINKAN[file.mimetype]?.[0] || path.extname(file.originalname);
        const nama = `user_${req.user.id}_${Date.now()}${ext}`;
        cb(null, nama);
    }
});

const fileFilter = (req, file, cb) => {

    const extAsli = path.extname(file.originalname).toLowerCase();
    const extDiizinkan = TIPE_DIIZINKAN[file.mimetype];

    if (!extDiizinkan) {
        return cb(new Error("Format foto harus JPG, PNG, atau WEBP"));
    }

    // Ekstensi nama file asli harus konsisten dengan mimetype yang
    // dikirim, supaya tidak ada file dengan ekstensi berbahaya (mis.
    // ".php", ".html") yang menyamar sebagai gambar.
    if (!extDiizinkan.includes(extAsli)) {
        return cb(new Error("Ekstensi file tidak sesuai dengan tipe filenya"));
    }

    cb(null, true);
};

const uploadFoto = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // maksimal 2MB
});

module.exports = uploadFoto;

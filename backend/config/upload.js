const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads", "profile");

// Pastikan folder upload ada
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const nama = `user_${req.user.id}_${Date.now()}${ext}`;
        cb(null, nama);
    }
});

const fileFilter = (req, file, cb) => {
    const tipeDiizinkan = ["image/jpeg", "image/png", "image/webp"];

    if (!tipeDiizinkan.includes(file.mimetype)) {
        return cb(new Error("Format foto harus JPG, PNG, atau WEBP"));
    }

    cb(null, true);
};

const uploadFoto = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // maksimal 2MB
});

module.exports = uploadFoto;

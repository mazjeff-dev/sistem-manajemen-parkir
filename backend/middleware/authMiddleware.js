const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Token tidak tersedia"
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (err) {

        console.log("JWT ERROR:", err.message);

        return res.status(401).json({
            message: "Token expired atau tidak valid"
        });

    }

};

// ===========================
// requireAdmin
// Dipakai SETELAH verifyToken. Membatasi endpoint tertentu
// (contoh: kelola Jenis Kendaraan) supaya hanya bisa diakses
// oleh user dengan role "admin". Role disematkan ke dalam JWT
// saat login (lihat authController.js), jadi tidak perlu query
// ulang ke database di setiap request.
// ===========================
const requireAdmin = (req, res, next) => {

    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            message: "Akses ditolak. Fitur ini khusus admin."
        });
    }

    next();

};

module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
module.exports.requireAdmin = requireAdmin;

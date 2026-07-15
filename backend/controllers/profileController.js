const db = require("../config/db");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// ===========================
// GET PROFILE (Informasi Akun)
// ===========================
exports.getProfile = async (req, res) => {

    try {

        const result = await queryAsync(
            `SELECT id, nama, email, foto, created_at
            FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (result.length === 0) {
            return res.status(404).json({
                message: "User tidak ditemukan"
            });
        }

        res.json(result[0]);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }

};

// ===========================
// EDIT PROFILE (nama & email)
// ===========================
exports.updateProfile = async (req, res) => {

    try {

        const { nama, email } = req.body;

        if (!nama || !email) {
            return res.status(400).json({
                message: "Nama dan email wajib diisi"
            });
        }

        // Pastikan email tidak dipakai user lain
        const emailDipakai = await queryAsync(
            "SELECT id FROM users WHERE email = ? AND id != ?",
            [email, req.user.id]
        );

        if (emailDipakai.length > 0) {
            return res.status(400).json({
                message: "Email sudah digunakan akun lain"
            });
        }

        await queryAsync(
            "UPDATE users SET nama = ?, email = ? WHERE id = ?",
            [nama, email, req.user.id]
        );

        res.json({ message: "Profile berhasil diperbarui" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }

};

// ===========================
// GANTI PASSWORD
// ===========================
exports.changePassword = async (req, res) => {

    try {

        const { password_lama, password_baru } = req.body;

        if (!password_lama || !password_baru) {
            return res.status(400).json({
                message: "Password lama dan password baru wajib diisi"
            });
        }

        if (password_baru.length < 6) {
            return res.status(400).json({
                message: "Password baru minimal 6 karakter"
            });
        }

        const result = await queryAsync(
            "SELECT password FROM users WHERE id = ?",
            [req.user.id]
        );

        if (result.length === 0) {
            return res.status(404).json({
                message: "User tidak ditemukan"
            });
        }

        const cocok = await bcrypt.compare(password_lama, result[0].password);

        if (!cocok) {
            return res.status(400).json({
                message: "Password lama tidak sesuai"
            });
        }

        const hashBaru = await bcrypt.hash(password_baru, 10);

        await queryAsync(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashBaru, req.user.id]
        );

        res.json({ message: "Password berhasil diubah" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }

};

// ===========================
// UPLOAD FOTO PROFILE
// ===========================
exports.uploadFoto = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: "Foto wajib diunggah"
            });
        }

        // Hapus foto lama kalau ada, supaya tidak menumpuk file
        const lama = await queryAsync(
            "SELECT foto FROM users WHERE id = ?",
            [req.user.id]
        );

        if (lama.length > 0 && lama[0].foto) {
            const fotoLamaPath = path.join(
                __dirname, "..", "uploads", "profile", lama[0].foto
            );
            fs.unlink(fotoLamaPath, () => {});
        }

        await queryAsync(
            "UPDATE users SET foto = ? WHERE id = ?",
            [req.file.filename, req.user.id]
        );

        res.json({
            message: "Foto profile berhasil diunggah",
            foto: req.file.filename
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }

};

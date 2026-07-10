const db = require("../config/db");
const bcrypt = require("bcrypt");

// REGISTER
exports.register = async (req, res) => {
    try {
        const { nama, email, password } = req.body;

        // Validasi
        if (!nama || !email || !password) {
            return res.status(400).json({
                message: "Semua field wajib diisi"
            });
        }

        // Cek email
        db.query(
            "SELECT * FROM users WHERE email = ?",
            [email],
            async (err, result) => {

                if (err) {
                    return res.status(500).json({
                        message: err.message
                    });
                }

                if (result.length > 0) {
                    return res.status(400).json({
                        message: "Email sudah terdaftar"
                    });
                }

                // Hash Password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Simpan User
                db.query(
                    "INSERT INTO users (nama, email, password) VALUES (?, ?, ?)",
                    [nama, email, hashedPassword],
                    (err, result) => {

                        if (err) {
                            return res.status(500).json({
                                message: err.message
                            });
                        }

                        return res.status(201).json({
                            message: "Register berhasil"
                        });

                    }
                );

            }
        );

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// LOGIN (sementara)
exports.login = (req, res) => {
    res.json({
        message: "Login belum dibuat"
    });
};
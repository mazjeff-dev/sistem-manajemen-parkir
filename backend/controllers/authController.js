const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { smtpTerkonfigurasi, kirimEmailResetPassword } = require("../services/emailService");

const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

const ACCESS_TOKEN_EXPIRES = "15m";

function buatAccessToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES }
    );
}

function buatRefreshToken() {
    return crypto.randomBytes(40).toString("hex");
}

// REGISTER
exports.register = async (req, res) => {
    try {
        const { nama, email, password } = req.body;

        if (!nama || !email || !password) {
            return res.status(400).json({
                message: "Semua field wajib diisi"
            });
        }

        db.query(
            "SELECT * FROM users WHERE email = ?",
            [email],
            async (err, result) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        message: "Terjadi kesalahan pada server"
                    });
                }

                if (result.length > 0) {
                    return res.status(400).json({
                        message: "Email sudah terdaftar"
                    });
                }

                const hashedPassword = await bcrypt.hash(password, 10);

                // Akun PERTAMA yang mendaftar di sistem otomatis jadi
                // "admin" (supaya selalu ada minimal satu admin tanpa
                // perlu setup manual lewat database). Akun berikutnya
                // default "petugas".
                db.query(
                    "SELECT COUNT(*) AS total FROM users",
                    async (err, countResult) => {

                        if (err) {
                            console.error(err);
                            return res.status(500).json({
                                message: "Terjadi kesalahan pada server"
                            });
                        }

                        const role = countResult[0].total === 0 ? "admin" : "petugas";

                        db.query(
                            "INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)",
                            [nama, email, hashedPassword, role],
                            (err, result) => {

                                if (err) {
                                    console.error(err);
                                    return res.status(500).json({
                                        message: "Terjadi kesalahan pada server"
                                    });
                                }

                                return res.status(201).json({
                                    message: role === "admin"
                                        ? "Register berhasil. Karena ini akun pertama, kamu otomatis menjadi admin."
                                        : "Register berhasil"
                                });

                            }
                        );

                    }
                );

            }
        );

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Terjadi kesalahan pada server"
        });
    }
};

// LOGIN
exports.login = (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email dan Password wajib diisi"
        });
    }

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Terjadi kesalahan pada server"
                });
            }

            if (result.length === 0) {
                return res.status(400).json({
                    message: "Email tidak ditemukan"
                });
            }

            const user = result[0];

            // Akun yang dinonaktifkan admin (lihat fitur Kelola User)
            // tidak boleh login sama sekali, walau password-nya benar.
            if (Number(user.aktif) === 0) {
                return res.status(403).json({
                    message: "Akun Anda telah dinonaktifkan. Hubungi admin untuk informasi lebih lanjut."
                });
            }

            const cocok = await bcrypt.compare(password, user.password);

            if (!cocok) {
                return res.status(400).json({
                    message: "Password salah"
                });
            }

            const accessToken = buatAccessToken(user);
            const refreshToken = buatRefreshToken();

            db.query(
                "UPDATE users SET refresh_token = ? WHERE id = ?",
                [refreshToken, user.id],
                (err) => {

                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            message: "Terjadi kesalahan pada server"
                        });
                    }

                    return res.status(200).json({
                        message: "Login berhasil",
                        token: accessToken,
                        refreshToken,
                        role: user.role,
                        nama: user.nama
                    });

                }
            );

        }
    );

};

// REFRESH TOKEN
exports.refreshToken = async (req, res) => {

    try {

        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token wajib disertakan"
            });
        }

        const rows = await queryAsync(
            "SELECT * FROM users WHERE refresh_token = ?",
            [refreshToken]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: "Refresh token tidak valid, silakan login ulang"
            });
        }

        const user = rows[0];

        // Akun bisa saja dinonaktifkan admin SETELAH user login (access
        // token 15 menit masih berlaku sampai kedaluwarsa). Titik ini
        // yang jadi kesempatan berikutnya untuk memutus sesi user itu -
        // refresh token-nya langsung dihapus supaya tidak bisa dipakai
        // lagi sama sekali (paksa logout).
        if (Number(user.aktif) === 0) {

            await queryAsync(
                "UPDATE users SET refresh_token = NULL WHERE id = ?",
                [user.id]
            );

            return res.status(403).json({
                message: "Akun Anda telah dinonaktifkan. Hubungi admin untuk informasi lebih lanjut."
            });

        }

        const newAccessToken = buatAccessToken(user);

        return res.json({
            token: newAccessToken,
            role: user.role
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Terjadi kesalahan pada server"
        });
    }

};

// LOGOUT
exports.logout = async (req, res) => {

    try {

        const { refreshToken } = req.body;

        if (refreshToken) {
            await queryAsync(
                "UPDATE users SET refresh_token = NULL WHERE refresh_token = ?",
                [refreshToken]
            );
        }

        res.json({ message: "Logout berhasil" });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Terjadi kesalahan pada server"
        });
    }

};

// LUPA PASSWORD
// Token reset dikirim lewat EMAIL (SMTP, lihat services/emailService.js
// dan variabel SMTP_* di .env.example). Token TIDAK pernah dikembalikan
// di response, kecuali mode demo: SMTP belum dikonfigurasi DAN
// NODE_ENV bukan "production" - supaya fitur tetap bisa dicoba saat
// development tanpa email server.
exports.forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email wajib diisi"
            });
        }

        const rows = await queryAsync(
            "SELECT id, email FROM users WHERE email = ?",
            [email]
        );

        const pesanUmum = {
            message: "Jika email terdaftar, instruksi reset password telah dibuat"
        };

        if (rows.length === 0) {
            return res.json(pesanUmum);
        }

        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 30 * 60 * 1000);

        await queryAsync(
            "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
            [token, expires, rows[0].id]
        );

        if (smtpTerkonfigurasi()) {

            try {
                await kirimEmailResetPassword(rows[0].email, token);
            } catch (errEmail) {
                // Gagal kirim email dicatat di server, tapi respons ke
                // client tetap sama supaya tidak membocorkan apakah
                // sebuah email terdaftar atau tidak.
                console.error("[forgotPassword] gagal mengirim email:", errEmail.message);
            }

            return res.json(pesanUmum);

        }

        if (process.env.NODE_ENV === "production") {
            console.error(
                "[forgotPassword] SMTP belum dikonfigurasi di production - " +
                "email reset tidak terkirim."
            );
            return res.json(pesanUmum);
        }

        // Mode demo (development tanpa SMTP).
        console.warn("[forgotPassword] SMTP belum dikonfigurasi - memakai devToken (mode demo).");

        return res.json({
            ...pesanUmum,
            devToken: token
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Terjadi kesalahan pada server"
        });
    }

};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {

    try {

        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                message: "Token dan password baru wajib diisi"
            });
        }

        const rows = await queryAsync(
            "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({
                message: "Token reset tidak valid atau sudah kedaluwarsa"
            });
        }

        const hashed = await bcrypt.hash(password, 10);

        await queryAsync(
            `UPDATE users
            SET password = ?, reset_token = NULL, reset_token_expires = NULL, refresh_token = NULL
            WHERE id = ?`,
            [hashed, rows[0].id]
        );

        res.json({
            message: "Password berhasil direset, silakan login dengan password baru"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Terjadi kesalahan pada server"
        });
    }

};

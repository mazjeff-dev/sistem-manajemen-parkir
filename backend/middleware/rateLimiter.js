const rateLimit = require("express-rate-limit");

// Membatasi percobaan login supaya tidak bisa di-brute-force
// (coba-coba password berkali-kali dalam waktu singkat).
// 10 percobaan / 15 menit per IP, cukup longgar untuk user yang
// salah ketik password beberapa kali tapi tetap menghalangi bot.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Terlalu banyak percobaan login. Coba lagi dalam beberapa menit."
    }
});

// Endpoint lupa password juga dibatasi supaya tidak bisa dipakai
// untuk spam permintaan reset ke email/akun orang lain.
const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Terlalu banyak permintaan reset password. Coba lagi dalam beberapa menit."
    }
});

// Setiap scan kamera memanggil layanan pihak ketiga yang berbayar,
// jadi dibatasi supaya tidak bisa dispam (60 scan / menit per IP
// sudah jauh di atas kecepatan gerbang parkir sungguhan).
const anprLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Terlalu banyak scan kamera. Tunggu sebentar lalu coba lagi."
    }
});

module.exports = { loginLimiter, forgotPasswordLimiter, anprLimiter };

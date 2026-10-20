// Pengirim email (reset password) lewat SMTP memakai nodemailer.
//
// Variabel environment yang dipakai (lihat .env.example):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE
//   FRONTEND_URL  -> dipakai membentuk link reset di dalam email
//
// nodemailer di-require secara "lazy" supaya server tetap bisa jalan
// (mode demo) walau paket belum di-install atau SMTP belum diisi.

function smtpTerkonfigurasi() {
    return Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    );
}

let transporter = null;

function getTransporter() {

    if (transporter) return transporter;

    const nodemailer = require("nodemailer");
    const port = Number(process.env.SMTP_PORT) || 587;

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        // true untuk port 465, false untuk 587 (STARTTLS)
        secure: process.env.SMTP_SECURE
            ? process.env.SMTP_SECURE === "true"
            : port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    return transporter;

}

async function kirimEmailResetPassword(tujuan, token) {

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173")
        .replace(/\/+$/, "");
    const link = `${frontendUrl}/reset-password?token=${token}`;

    await getTransporter().sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: tujuan,
        subject: "Reset Password - Sistem Manajemen Parkir",
        text:
            "Kami menerima permintaan reset password untuk akunmu.\n\n" +
            `Buka link berikut (berlaku 30 menit):\n${link}\n\n` +
            "Jika kamu tidak merasa memintanya, abaikan email ini.",
        html:
            "<p>Kami menerima permintaan reset password untuk akunmu.</p>" +
            `<p><a href="${link}">Klik di sini untuk membuat password baru</a>` +
            " (berlaku 30 menit).</p>" +
            "<p>Jika kamu tidak merasa memintanya, abaikan email ini.</p>"
    });

}

module.exports = { smtpTerkonfigurasi, kirimEmailResetPassword };

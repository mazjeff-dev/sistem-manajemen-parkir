const db = require("../config/db");

// Mencatat aksi penting ke tabel audit_log. Sengaja "fire and forget":
// kalau pencatatan gagal (misalnya migrasi 004 belum dijalankan), proses
// utama (kendaraan masuk/keluar, dsb) TIDAK ikut gagal - cukup ditulis
// ke log server.
function catatAudit(req, aksi, entitas, entitasId, detail) {

    const userId = req.user?.id ?? null;
    const userEmail = req.user?.email ?? null;
    const detailText = detail
        ? (typeof detail === "string" ? detail : JSON.stringify(detail))
        : null;

    db.query(
        `INSERT INTO audit_log
        (user_id, user_email, aksi, entitas, entitas_id, detail)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, userEmail, aksi, entitas, entitasId ?? null, detailText],
        (err) => {
            if (err) {
                console.error("[audit_log] gagal mencatat:", err.message);
            }
        }
    );

}

module.exports = { catatAudit };

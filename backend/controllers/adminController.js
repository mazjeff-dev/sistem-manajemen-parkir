const db = require("../config/db");
const { catatAudit } = require("../services/auditService");

const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// GET semua user (tanpa password/token) - dipakai halaman
// "Kelola User" khusus admin.
exports.getUsers = (req, res) => {

    db.query(
        `SELECT id, nama, email, role, aktif
        FROM users
        ORDER BY id ASC`,
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Terjadi kesalahan pada server"
                });
            }

            res.json(result);

        }
    );

};

// UPDATE role user (admin <-> petugas)
exports.updateUserRole = async (req, res) => {

    const { id } = req.params;
    const { role } = req.body;

    if (role !== "admin" && role !== "petugas") {
        return res.status(400).json({
            message: "Role harus 'admin' atau 'petugas'"
        });
    }

    // Admin tidak boleh mengubah role akun sendiri lewat halaman ini -
    // supaya tidak ada admin yang tidak sengaja menurunkan diri
    // sendiri jadi petugas dan langsung kehilangan akses ke halaman
    // ini juga. Kalau memang perlu, minta admin LAIN yang mengubah.
    if (Number(id) === Number(req.user.id)) {
        return res.status(400).json({
            message: "Tidak bisa mengubah role akun sendiri. Minta admin lain untuk mengubahnya."
        });
    }

    try {

        const rows = await queryAsync(
            "SELECT id, role FROM users WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "User tidak ditemukan"
            });
        }

        const target = rows[0];

        // Selalu harus ada minimal SATU admin aktif di sistem, supaya
        // tidak ada yang terkunci dari fitur admin sama sekali.
        if (target.role === "admin" && role === "petugas") {

            const adminRows = await queryAsync(
                "SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND aktif = 1"
            );

            if (adminRows[0].total <= 1) {
                return res.status(400).json({
                    message: "Tidak bisa mengubah role admin terakhir. Sistem harus punya minimal satu admin aktif."
                });
            }

        }

        await queryAsync(
            "UPDATE users SET role = ? WHERE id = ?",
            [role, id]
        );

        res.json({
            message: `Role user berhasil diubah menjadi ${role}`
        });

    } catch (err) {

        console.error("[updateUserRole]", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan pada server"
        });

    }

};

// UPDATE status aktif/nonaktif akun
exports.updateUserStatus = async (req, res) => {

    const { id } = req.params;
    const { aktif } = req.body;

    if (typeof aktif !== "boolean") {
        return res.status(400).json({
            message: "Status aktif harus berupa true/false"
        });
    }

    // Admin tidak boleh menonaktifkan akun sendiri (bisa keluar akses
    // ke sistem sepenuhnya tanpa ada yang bisa mengaktifkan lagi).
    if (Number(id) === Number(req.user.id)) {
        return res.status(400).json({
            message: "Tidak bisa menonaktifkan akun sendiri. Minta admin lain untuk melakukannya."
        });
    }

    try {

        const rows = await queryAsync(
            "SELECT id, role, aktif FROM users WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "User tidak ditemukan"
            });
        }

        const target = rows[0];

        // Sama seperti perubahan role, harus tetap ada minimal satu
        // admin AKTIF supaya sistem tidak pernah terkunci total.
        if (target.role === "admin" && !aktif) {

            const adminRows = await queryAsync(
                "SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND aktif = 1"
            );

            if (adminRows[0].total <= 1) {
                return res.status(400).json({
                    message: "Tidak bisa menonaktifkan admin terakhir. Sistem harus punya minimal satu admin aktif."
                });
            }

        }

        await queryAsync(
            "UPDATE users SET aktif = ? WHERE id = ?",
            [aktif ? 1 : 0, id]
        );

        // Kalau dinonaktifkan, putus juga sesi refresh token yang
        // sedang berjalan supaya tidak bisa dipakai perpanjang akses
        // token lagi (lihat juga pengecekan tambahan di authController
        // refreshToken, untuk jaga-jaga akses token lama masih hidup).
        if (!aktif) {
            await queryAsync(
                "UPDATE users SET refresh_token = NULL WHERE id = ?",
                [id]
            );
        }

        res.json({
            message: aktif
                ? "Akun berhasil diaktifkan kembali"
                : "Akun berhasil dinonaktifkan"
        });

    } catch (err) {

        console.error("[updateUserStatus]", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan pada server"
        });

    }

};

// GET audit log (riwayat aksi penting petugas/admin) - khusus admin.
// Mendukung ?page=&limit=&q= (q mencari di aksi, email, dan detail).
exports.getAuditLog = async (req, res) => {

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const q = (req.query.q || "").trim();

    const whereClause = q
        ? `WHERE audit_log.aksi LIKE ? OR audit_log.user_email LIKE ? OR audit_log.detail LIKE ?`
        : "";
    const whereParams = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [];

    try {

        const countRows = await queryAsync(
            `SELECT COUNT(*) AS total FROM audit_log ${whereClause}`,
            whereParams
        );

        const total = countRows[0].total;

        const rows = await queryAsync(
            `SELECT
                audit_log.id,
                audit_log.user_id,
                audit_log.user_email,
                users.nama AS user_nama,
                audit_log.aksi,
                audit_log.entitas,
                audit_log.entitas_id,
                audit_log.detail,
                audit_log.created_at
            FROM audit_log
            LEFT JOIN users ON audit_log.user_id = users.id
            ${whereClause}
            ORDER BY audit_log.id DESC
            LIMIT ? OFFSET ?`,
            [...whereParams, limit, offset]
        );

        res.json({
            data: rows,
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit))
        });

    } catch (err) {

        console.error("[getAuditLog]", err);

        // Tabel belum ada = migrasi 004 belum dijalankan.
        if (err.code === "ER_NO_SUCH_TABLE") {
            return res.status(500).json({
                message: "Tabel audit_log belum ada. Jalankan migrasi 004_audit_tarif_pembayaran.sql"
            });
        }

        res.status(500).json({
            message: "Terjadi kesalahan pada server"
        });

    }

};

// Validasi ?older_than_days=N (bilangan bulat 1..3650). null = tidak valid.
function parseOlderThanDays(value) {

    const days = Number(value);

    if (!Number.isInteger(days) || days < 1 || days > 3650) return null;

    return days;

}

const PESAN_DAYS_TIDAK_VALID =
    "older_than_days harus berupa bilangan bulat antara 1 dan 3650";

// GET jumlah audit log yang AKAN terhapus (dry-run, tidak menghapus apa pun).
// Dipakai modal konfirmasi supaya admin tahu dampaknya sebelum menghapus.
exports.countOldAuditLog = async (req, res) => {

    const days = parseOlderThanDays(req.query.older_than_days);

    if (days === null) {
        return res.status(400).json({ message: PESAN_DAYS_TIDAK_VALID });
    }

    try {

        const rows = await queryAsync(
            "SELECT COUNT(*) AS jumlah FROM audit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
            [days]
        );

        res.json({ older_than_days: days, count: rows[0].jumlah });

    } catch (err) {

        console.error("[countOldAuditLog]", err);

        if (err.code === "ER_NO_SUCH_TABLE") {
            return res.status(500).json({
                message: "Tabel audit_log belum ada. Jalankan migrasi 004_audit_tarif_pembayaran.sql"
            });
        }

        res.status(500).json({ message: "Terjadi kesalahan pada server" });

    }

};

// DELETE audit log yang lebih lama dari N hari - khusus admin.
// Query: ?older_than_days=90
// Penghapusan itu sendiri dicatat sebagai satu baris baru di audit_log
// (dibuat SETELAH penghapusan, jadi barisnya tidak ikut terhapus).
exports.deleteOldAuditLog = async (req, res) => {

    const days = parseOlderThanDays(req.query.older_than_days);

    if (days === null) {
        return res.status(400).json({ message: PESAN_DAYS_TIDAK_VALID });
    }

    try {

        const result = await queryAsync(
            "DELETE FROM audit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
            [days]
        );

        catatAudit(req, "HAPUS_AUDIT_LOG", "audit_log", null, {
            older_than_days: days,
            jumlah_dihapus: result.affectedRows
        });

        res.json({
            message: `${result.affectedRows} catatan audit lebih lama dari ${days} hari berhasil dihapus`,
            deleted: result.affectedRows
        });

    } catch (err) {

        console.error("[deleteOldAuditLog]", err);

        if (err.code === "ER_NO_SUCH_TABLE") {
            return res.status(500).json({
                message: "Tabel audit_log belum ada. Jalankan migrasi 004_audit_tarif_pembayaran.sql"
            });
        }

        res.status(500).json({
            message: "Terjadi kesalahan pada server"
        });

    }

};

const db = require("../config/db");

// CREATE
exports.createKendaraan = (req, res) => {

    const {
        plat_nomor,
        nama_pemilik,
        warna,
        jenis_id
    } = req.body;

    if (!plat_nomor || !nama_pemilik || !warna || !jenis_id) {
        return res.status(400).json({
            message: "Semua field wajib diisi"
        });
    }

    const platNomorClean = String(plat_nomor).trim().toUpperCase();

    if (platNomorClean.length === 0) {
        return res.status(400).json({
            message: "Plat nomor tidak boleh kosong"
        });
    }

    db.query(
        "SELECT id FROM kendaraan WHERE UPPER(plat_nomor) = ?",
        [platNomorClean],
        (err, existing) => {

            if (err) {
                console.error("[createKendaraan] duplicate check:", err);
                return res.status(500).json({
                    message: "Terjadi kesalahan pada server"
                });
            }

            if (existing.length > 0) {
                return res.status(400).json({
                    message: "Plat nomor ini sudah terdaftar"
                });
            }

            db.query(
                `INSERT INTO kendaraan
                (plat_nomor, nama_pemilik, warna, jenis_id)
                VALUES (?, ?, ?, ?)`,
                [platNomorClean, nama_pemilik, warna, jenis_id],
                (err, result) => {

                    if (err) {
                        console.error("[createKendaraan] insert:", err);
                        return res.status(500).json({
                            message: "Terjadi kesalahan pada server"
                        });
                    }

                    res.status(201).json({
                        message: "Kendaraan berhasil ditambahkan"
                    });

                }
            );

        }
    );

};

// READ (server-side pagination & search)
// Query params opsional: page (default 1), limit (default 10), q (cari plat/nama)
exports.getKendaraan = (req, res) => {

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const q = (req.query.q || "").trim();

    const whereClause = q ? `WHERE kendaraan.plat_nomor LIKE ? OR kendaraan.nama_pemilik LIKE ?` : "";
    const whereParams = q ? [`%${q}%`, `%${q}%`] : [];

    db.query(
        `SELECT COUNT(*) AS total FROM kendaraan ${whereClause}`,
        whereParams,
        (err, countResult) => {

            if (err) {
                console.error("[getKendaraan] count:", err);
                return res.status(500).json({
                    message: "Terjadi kesalahan pada server"
                });
            }

            const total = countResult[0].total;

            db.query(
                `SELECT
                    kendaraan.id,
                    kendaraan.plat_nomor,
                    kendaraan.nama_pemilik,
                    kendaraan.warna,
                    kendaraan.jenis_id,
                    jenis_kendaraan.nama_jenis
                FROM kendaraan
                JOIN jenis_kendaraan
                ON kendaraan.jenis_id = jenis_kendaraan.id
                ${whereClause}
                ORDER BY kendaraan.id DESC
                LIMIT ? OFFSET ?`,
                [...whereParams, limit, offset],
                (err, result) => {

                    if (err) {
                        console.error("[getKendaraan]", err);
                        return res.status(500).json({
                            message: "Terjadi kesalahan pada server"
                        });
                    }

                    res.json({
                        data: result,
                        total,
                        page,
                        limit,
                        totalPages: Math.max(1, Math.ceil(total / limit))
                    });

                }
            );

        }
    );

};

// UPDATE
exports.updateKendaraan = (req, res) => {

    const { id } = req.params;

    const {
        plat_nomor,
        nama_pemilik,
        warna,
        jenis_id
    } = req.body;

    if (!plat_nomor || !nama_pemilik || !warna || !jenis_id) {
        return res.status(400).json({
            message: "Semua field wajib diisi"
        });
    }

    const platNomorClean = String(plat_nomor).trim().toUpperCase();

    if (platNomorClean.length === 0) {
        return res.status(400).json({
            message: "Plat nomor tidak boleh kosong"
        });
    }

    db.query(
        "SELECT id FROM kendaraan WHERE UPPER(plat_nomor) = ? AND id != ?",
        [platNomorClean, id],
        (err, existing) => {

            if (err) {
                console.error("[updateKendaraan] duplicate check:", err);
                return res.status(500).json({
                    message: "Terjadi kesalahan pada server"
                });
            }

            if (existing.length > 0) {
                return res.status(400).json({
                    message: "Plat nomor sudah digunakan kendaraan lain"
                });
            }

            db.query(
                `UPDATE kendaraan
                SET
                plat_nomor = ?,
                nama_pemilik = ?,
                warna = ?,
                jenis_id = ?
                WHERE id = ?`,
                [
                    platNomorClean,
                    nama_pemilik,
                    warna,
                    jenis_id,
                    id
                ],
                (err, result) => {

                    if (err) {
                        console.error("[updateKendaraan] update:", err);
                        return res.status(500).json({
                            message: "Terjadi kesalahan pada server"
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            message: "Data tidak ditemukan"
                        });
                    }

                    res.json({
                        message: "Kendaraan berhasil diupdate"
                    });

                }
            );

        }
    );

};

// DELETE
exports.deleteKendaraan = (req, res) => {

    const { id } = req.params;

    db.query(
        "SELECT id FROM parkir WHERE kendaraan_id = ? LIMIT 1",
        [id],
        (err, riwayat) => {

            if (err) {
                console.error("[deleteKendaraan] check riwayat:", err);
                return res.status(500).json({
                    message: "Terjadi kesalahan pada server"
                });
            }

            if (riwayat.length > 0) {
                return res.status(400).json({
                    message: "Kendaraan tidak bisa dihapus karena masih memiliki riwayat parkir"
                });
            }

            db.query(
                "DELETE FROM kendaraan WHERE id = ?",
                [id],
                (err, result) => {

                    if (err) {
                        console.error("[deleteKendaraan] delete:", err);
                        return res.status(500).json({
                            message: "Terjadi kesalahan pada server"
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            message: "Data tidak ditemukan"
                        });
                    }

                    res.json({
                        message: "Kendaraan berhasil dihapus"
                    });

                }
            );

        }
    );

};

const db = require("../config/db");

// =======================
// CREATE
// =======================
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

    db.query(
        `INSERT INTO kendaraan
        (plat_nomor, nama_pemilik, warna, jenis_id)
        VALUES (?, ?, ?, ?)`,
        [plat_nomor, nama_pemilik, warna, jenis_id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            res.status(201).json({
                message: "Kendaraan berhasil ditambahkan"
            });

        }
    );

};

// =======================
// READ
// =======================
exports.getKendaraan = (req, res) => {

    db.query(
        `SELECT
            kendaraan.id,
            kendaraan.plat_nomor,
            kendaraan.nama_pemilik,
            kendaraan.warna,
            jenis_kendaraan.nama_jenis
        FROM kendaraan
        JOIN jenis_kendaraan
        ON kendaraan.jenis_id = jenis_kendaraan.id`,
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            res.json(result);

        }
    );

};

// =======================
// UPDATE
// =======================
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

    db.query(
        `UPDATE kendaraan
        SET
        plat_nomor = ?,
        nama_pemilik = ?,
        warna = ?,
        jenis_id = ?
        WHERE id = ?`,
        [
            plat_nomor,
            nama_pemilik,
            warna,
            jenis_id,
            id
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: err.message
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

};

// =======================
// DELETE
// =======================
exports.deleteKendaraan = (req, res) => {

    const { id } = req.params;

    db.query(
        "DELETE FROM kendaraan WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: err.message
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

};
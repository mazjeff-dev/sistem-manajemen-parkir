const db = require("../config/db");

// ===========================
// CREATE (Kendaraan Masuk)
// ===========================
exports.createParkir = (req, res) => {

    const {
        kendaraan_id,
        waktu_masuk
    } = req.body;

    if (!kendaraan_id || !waktu_masuk) {
        return res.status(400).json({
            message: "Semua field wajib diisi"
        });
    }

    db.query(
        `INSERT INTO parkir
        (kendaraan_id, waktu_masuk)
        VALUES (?, ?)`,
        [kendaraan_id, waktu_masuk],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            res.status(201).json({
                message: "Data parkir berhasil ditambahkan"
            });

        }
    );

};

// ===========================
// READ
// ===========================
exports.getParkir = (req, res) => {

    db.query(
        `SELECT
            parkir.id,
            kendaraan.plat_nomor,
            kendaraan.nama_pemilik,
            kendaraan.warna,
            jenis_kendaraan.nama_jenis,
            parkir.waktu_masuk,
            parkir.waktu_keluar,
            parkir.status,
            parkir.biaya
        FROM parkir
        JOIN kendaraan
            ON parkir.kendaraan_id = kendaraan.id
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

// ===========================
// UPDATE (Kendaraan Keluar)
// ===========================
exports.updateParkir = (req, res) => {

    const { id } = req.params;

    const {
        waktu_keluar,
        status,
        biaya
    } = req.body;

    db.query(
        `UPDATE parkir
        SET
            waktu_keluar = ?,
            status = ?,
            biaya = ?
        WHERE id = ?`,
        [
            waktu_keluar,
            status,
            biaya,
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
                message: "Data parkir berhasil diupdate"
            });

        }
    );

};

// ===========================
// DELETE
// ===========================
exports.deleteParkir = (req, res) => {

    const { id } = req.params;

    db.query(
        "DELETE FROM parkir WHERE id = ?",
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
                message: "Data parkir berhasil dihapus"
            });

        }
    );

};
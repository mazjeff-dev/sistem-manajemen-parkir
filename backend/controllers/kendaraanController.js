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

    // Normalisasi plat nomor: hapus spasi berlebih di awal/akhir dan
    // seragamkan jadi huruf kapital, supaya "b 1234 xyz" dan
    // "B 1234 XYZ" dianggap plat yang sama saat dicek duplikat.
    const platNomorClean = String(plat_nomor).trim().toUpperCase();

    if (platNomorClean.length === 0) {
        return res.status(400).json({
            message: "Plat nomor tidak boleh kosong"
        });
    }

    // Cegah plat nomor yang sama terdaftar dua kali sebagai kendaraan berbeda
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
                console.error("[getKendaraan]", err);
                return res.status(500).json({
                    message: "Terjadi kesalahan pada server"
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

    // Normalisasi plat nomor dengan cara yang SAMA seperti di createKendaraan,
    // supaya standar pengecekan duplikat konsisten di seluruh aplikasi.
    const platNomorClean = String(plat_nomor).trim().toUpperCase();

    if (platNomorClean.length === 0) {
        return res.status(400).json({
            message: "Plat nomor tidak boleh kosong"
        });
    }

    // Cek duplikat plat nomor terhadap kendaraan LAIN (bukan dirinya
    // sendiri), supaya update tidak bentrok dengan kendaraan lain yang
    // kebetulan sudah pakai plat nomor yang sama.
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

// =======================
// DELETE
// =======================
exports.deleteKendaraan = (req, res) => {

    const { id } = req.params;

    // Cek dulu apakah kendaraan ini masih punya riwayat parkir.
    // Sebelumnya kendaraan bisa langsung dihapus meskipun masih
    // punya riwayat parkir terkait, yang bisa membuat data parkir
    // "yatim" (kehilangan referensi kendaraan) atau membuat laporan
    // jadi tidak akurat.
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
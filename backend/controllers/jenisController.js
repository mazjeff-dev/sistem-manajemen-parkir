const db = require("../config/db");

// CREATE
exports.createJenis = (req, res) => {

    const { nama_jenis, tarif } = req.body;

    if (!nama_jenis || tarif === undefined || tarif === null || tarif === "") {
        return res.status(400).json({
            message: "Nama jenis dan tarif wajib diisi"
        });
    }

    const tarifNum = Number(tarif);

    if (isNaN(tarifNum) || tarifNum < 0) {
        return res.status(400).json({
            message: "Tarif harus berupa angka dan tidak boleh negatif"
        });
    }

    db.query(
        "INSERT INTO jenis_kendaraan (nama_jenis, tarif) VALUES (?, ?)",
        [nama_jenis, tarifNum],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            res.status(201).json({
                message: "Jenis kendaraan berhasil ditambahkan"
            });

        }
    );

};


// READ
exports.getJenis = (req, res) => {

    db.query(
        "SELECT * FROM jenis_kendaraan",
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


// UPDATE
exports.updateJenis = (req, res) => {

    const { id } = req.params;
    const { nama_jenis, tarif } = req.body;

    if (!nama_jenis || tarif === undefined || tarif === null || tarif === "") {
        return res.status(400).json({
            message: "Nama jenis dan tarif wajib diisi"
        });
    }

    const tarifNum = Number(tarif);

    if (isNaN(tarifNum) || tarifNum < 0) {
        return res.status(400).json({
            message: "Tarif harus berupa angka dan tidak boleh negatif"
        });
    }

    db.query(
        "UPDATE jenis_kendaraan SET nama_jenis = ?, tarif = ? WHERE id = ?",
        [nama_jenis, tarifNum, id],
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
                message: "Jenis kendaraan berhasil diubah"
            });

        }
    );

};


// DELETE
exports.deleteJenis = (req, res) => {

    const { id } = req.params;

    // Cek apakah jenis masih digunakan
    db.query(
        "SELECT * FROM kendaraan WHERE jenis_id = ?",
        [id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            }

            if (result.length > 0) {
                return res.status(400).json({
                    message: "Jenis kendaraan masih digunakan oleh data kendaraan."
                });
            }

            // Jika tidak digunakan, baru hapus
            db.query(
                "DELETE FROM jenis_kendaraan WHERE id = ?",
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
                        message: "Jenis kendaraan berhasil dihapus"
                    });

                }
            );

        }
    );

};
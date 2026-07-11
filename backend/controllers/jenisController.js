const db = require("../config/db");

// CREATE
exports.createJenis = (req, res) => {

    const { nama_jenis } = req.body;

    if (!nama_jenis) {
        return res.status(400).json({
            message: "Nama jenis wajib diisi"
        });
    }

    db.query(
        "INSERT INTO jenis_kendaraan (nama_jenis) VALUES (?)",
        [nama_jenis],
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
    const { nama_jenis } = req.body;

    if (!nama_jenis) {
        return res.status(400).json({
            message: "Nama jenis wajib diisi"
        });
    }

    db.query(
        "UPDATE jenis_kendaraan SET nama_jenis = ? WHERE id = ?",
        [nama_jenis, id],
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

};
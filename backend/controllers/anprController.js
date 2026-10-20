const db = require("../config/db");
const { kenaliKendaraan, kunciPlat } = require("../services/anprService");

const queryAsync = (sql, params = []) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => err ? reject(err) : resolve(result));
});

// POST /api/anpr/scan  (multipart/form-data, field "foto")
// Mengenali plat nomor + warna + jenis dari foto kamera, lalu
// mencocokkan dengan data kendaraan yang sudah terdaftar supaya
// petugas tidak perlu mengetik ulang.
exports.scan = async (req, res) => {

    if (!req.file) {
        return res.status(400).json({ message: "Foto wajib dikirim" });
    }

    try {

        const hasil = await kenaliKendaraan(req.file.buffer, req.file.mimetype);

        let kendaraan = null;
        let sedangParkir = false;

        if (hasil.plat_nomor) {

            const rows = await queryAsync(
                `SELECT id, plat_nomor, nama_pemilik, warna, jenis_id
                FROM kendaraan
                WHERE REPLACE(REPLACE(UPPER(plat_nomor), ' ', ''), '-', '') = ?
                LIMIT 1`,
                [kunciPlat(hasil.plat_nomor)]
            );

            kendaraan = rows[0] || null;

            if (kendaraan) {
                const aktif = await queryAsync(
                    `SELECT id FROM parkir WHERE kendaraan_id = ? AND status = 'Parkir' LIMIT 1`,
                    [kendaraan.id]
                );
                sedangParkir = aktif.length > 0;
            }

        }

        res.json({ ...hasil, kendaraan, sedang_parkir: sedangParkir });

    } catch (err) {

        if (!err.status) console.error("[anpr.scan]", err);

        res.status(err.status || 500).json({
            message: err.status ? err.message : "Terjadi kesalahan pada server"
        });

    }

};

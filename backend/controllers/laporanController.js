const db = require("../config/db");

// ===========================
// Helper: bungkus db.query jadi Promise supaya bisa
// dipakai dengan async/await + try/catch (pola sama
// seperti di dashboardController.js)
// ===========================
const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// ===========================
// GET LAPORAN
// Mengambil seluruh riwayat parkir (JOIN parkir + kendaraan + jenis_kendaraan)
// Mendukung filter rentang tanggal lewat query string:
// GET /api/laporan
// GET /api/laporan?start=YYYY-MM-DD&end=YYYY-MM-DD
// ===========================
exports.getLaporan = async (req, res) => {

    try {

        const { start, end } = req.query;

        // Query dasar, filter tanggal ditambahkan secara dinamis
        // agar endpoint tetap bisa dipanggil tanpa filter sama sekali
        let sql = `
            SELECT
                parkir.id,
                kendaraan.plat_nomor,
                kendaraan.nama_pemilik,
                jenis_kendaraan.nama_jenis,
                parkir.waktu_masuk,
                parkir.waktu_keluar,
                parkir.status,
                parkir.biaya,
                CASE
                    WHEN parkir.waktu_keluar IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, parkir.waktu_masuk, parkir.waktu_keluar)
                    ELSE NULL
                END AS durasi_menit
            FROM parkir
            JOIN kendaraan
                ON parkir.kendaraan_id = kendaraan.id
            JOIN jenis_kendaraan
                ON kendaraan.jenis_id = jenis_kendaraan.id
            WHERE 1 = 1
        `;

        const params = [];

        // Filter tanggal awal (berdasarkan tanggal waktu masuk)
        if (start) {
            sql += " AND DATE(parkir.waktu_masuk) >= ?";
            params.push(start);
        }

        // Filter tanggal akhir (berdasarkan tanggal waktu masuk)
        if (end) {
            sql += " AND DATE(parkir.waktu_masuk) <= ?";
            params.push(end);
        }

        sql += " ORDER BY parkir.waktu_masuk DESC";

        const rows = await queryAsync(sql, params);

        res.json(rows);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

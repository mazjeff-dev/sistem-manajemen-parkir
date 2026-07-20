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
// TARIF PARKIR OTOMATIS
// Tarif TETAP per transaksi, TIDAK berdasarkan durasi/jam
// ===========================
const TARIF_PARKIR = {
    motor: 2000,
    mobil: 5000,
    bus: 10000,
    truk: 15000
};

// Menentukan tarif tetap berdasarkan nama jenis kendaraan.
// Menggunakan pencocokan kata kunci (bukan exact match) supaya
// tetap tahan terhadap variasi penamaan jenis, contoh:
// "Sepeda Motor", "Mobil Pribadi", dll.
function getTarifByJenis(namaJenis) {

    const nama = String(namaJenis || "").toLowerCase();

    if (nama.includes("truk")) return TARIF_PARKIR.truk;
    if (nama.includes("bus")) return TARIF_PARKIR.bus;
    if (nama.includes("mobil")) return TARIF_PARKIR.mobil;
    if (nama.includes("motor")) return TARIF_PARKIR.motor;

    return null;

}

// Format durasi (dalam menit) jadi teks "X jam Y menit"
function formatDurasi(totalMenit) {

    const jam = Math.floor(totalMenit / 60);
    const menit = totalMenit % 60;

    if (jam > 0 && menit > 0) return `${jam} jam ${menit} menit`;
    if (jam > 0) return `${jam} jam`;

    return `${menit} menit`;

}

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
// Tarif dihitung otomatis di backend berdasarkan jenis
// kendaraan (tarif tetap per transaksi, bukan per jam).
// ===========================
exports.updateParkir = async (req, res) => {

    const { id } = req.params;
    const { waktu_keluar } = req.body;

    try {

        // 1. Pastikan data parkir tersedia (join untuk ambil jenis kendaraan)
        const rows = await queryAsync(
            `SELECT
                parkir.id,
                parkir.waktu_masuk,
                parkir.status,
                kendaraan.plat_nomor,
                jenis_kendaraan.nama_jenis
            FROM parkir
            JOIN kendaraan
                ON parkir.kendaraan_id = kendaraan.id
            JOIN jenis_kendaraan
                ON kendaraan.jenis_id = jenis_kendaraan.id
            WHERE parkir.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Data parkir tidak ditemukan"
            });
        }

        const dataParkir = rows[0];

        // 2. Pastikan status masih Aktif ("Parkir"), tidak bisa diproses keluar dua kali
        if (dataParkir.status !== "Parkir") {
            return res.status(400).json({
                message: "Kendaraan ini sudah diproses keluar sebelumnya"
            });
        }

        // 3. Tentukan jam keluar (pakai waktu sekarang jika tidak dikirim)
        const waktuKeluarDate = waktu_keluar
            ? new Date(waktu_keluar.replace(" ", "T"))
            : new Date();

        const waktuMasukDate = new Date(
            String(dataParkir.waktu_masuk).replace(" ", "T")
        );

        // Jam keluar tidak boleh lebih awal dari jam masuk
        if (waktuKeluarDate < waktuMasukDate) {
            return res.status(400).json({
                message: "Jam keluar tidak boleh lebih awal dari jam masuk"
            });
        }

        // 4. Tentukan tarif tetap berdasarkan jenis kendaraan
        const tarif = getTarifByJenis(dataParkir.nama_jenis);

        if (tarif === null) {
            return res.status(400).json({
                message: `Tarif untuk jenis kendaraan "${dataParkir.nama_jenis}" belum diatur`
            });
        }

        // 5. Hitung durasi parkir (hanya untuk informasi, tidak memengaruhi biaya)
        const totalMenit = Math.max(
            0,
            Math.round((waktuKeluarDate - waktuMasukDate) / 60000)
        );
        const durasiText = formatDurasi(totalMenit);

        const waktuKeluarSql = waktu_keluar
            ? waktu_keluar
            : waktuKeluarDate.toISOString().slice(0, 19).replace("T", " ");

        // 6. Simpan waktu_keluar, status, dan biaya (tarif tetap)
        const result = await queryAsync(
            `UPDATE parkir
            SET
                waktu_keluar = ?,
                status = 'Keluar',
                biaya = ?
            WHERE id = ? AND status = 'Parkir'`,
            [waktuKeluarSql, tarif, id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "Kendaraan ini sudah diproses keluar sebelumnya"
            });
        }

        res.json({
            message: "Kendaraan berhasil keluar",
            data: {
                plat_nomor: dataParkir.plat_nomor,
                jenis_kendaraan: dataParkir.nama_jenis,
                waktu_masuk: dataParkir.waktu_masuk,
                waktu_keluar: waktuKeluarSql,
                durasi: durasiText,
                biaya: tarif,
                status: "Keluar"
            }
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

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
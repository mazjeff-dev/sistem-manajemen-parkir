const db = require("../config/db");
const crypto = require("crypto");

const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// Aturan perhitungan biaya (flat, per jam, masa gratis, jam pertama,
// batas harian) ada di services/tarifService.js supaya dipakai bersama
// oleh proses keluar dan endpoint preview.
const {
    hitungBiaya,
    hitungTotalMenit,
    formatDurasi
} = require("../services/tarifService");
const { catatAudit } = require("../services/auditService");

const METODE_BAYAR = ["tunai", "qris", "transfer"];

// "YYYY-MM-DD HH:mm:ss" dalam waktu LOKAL server (sebelumnya memakai
// toISOString() yang UTC, sehingga bisa selisih beberapa jam).
function formatSqlLokal(date) {
    const p = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ` +
        `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

// Menghasilkan kode tiket unik, contoh: "TKT-20260810-A1B2C3"
function buatKodeTiket() {
    const tanggal = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const acak = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `TKT-${tanggal}-${acak}`;
}

// CREATE (Kendaraan Masuk)
exports.createParkir = async (req, res) => {

    const {
        kendaraan_id,
        waktu_masuk
    } = req.body;

    if (!kendaraan_id || !waktu_masuk) {
        return res.status(400).json({
            message: "Semua field wajib diisi"
        });
    }

    try {

        const aktif = await queryAsync(
            `SELECT id FROM parkir WHERE kendaraan_id = ? AND status = 'Parkir'`,
            [kendaraan_id]
        );

        if (aktif.length > 0) {
            return res.status(400).json({
                message: "Kendaraan ini masih tercatat sedang parkir"
            });
        }

        // ===========================
        // CEK KAPASITAS / SLOT PARKIR
        // kapasitas NULL/0 berarti tidak dibatasi.
        // ===========================
        const jenisRows = await queryAsync(
            `SELECT jenis_kendaraan.id AS jenis_id, jenis_kendaraan.nama_jenis, jenis_kendaraan.kapasitas
            FROM kendaraan
            JOIN jenis_kendaraan ON kendaraan.jenis_id = jenis_kendaraan.id
            WHERE kendaraan.id = ?`,
            [kendaraan_id]
        );

        if (jenisRows.length === 0) {
            return res.status(404).json({
                message: "Kendaraan tidak ditemukan"
            });
        }

        const { jenis_id, nama_jenis, kapasitas } = jenisRows[0];

        if (kapasitas !== null && Number(kapasitas) > 0) {

            const terisiRows = await queryAsync(
                `SELECT COUNT(*) AS jumlah
                FROM parkir
                JOIN kendaraan ON parkir.kendaraan_id = kendaraan.id
                WHERE kendaraan.jenis_id = ? AND parkir.status = 'Parkir'`,
                [jenis_id]
            );

            const terisi = terisiRows[0].jumlah;

            if (terisi >= Number(kapasitas)) {
                return res.status(400).json({
                    message: `Slot parkir untuk jenis "${nama_jenis}" sudah penuh (${terisi}/${kapasitas})`
                });
            }

        }

        const kodeTiket = buatKodeTiket();

        const insertResult = await queryAsync(
            `INSERT INTO parkir
            (kendaraan_id, kode_tiket, waktu_masuk, petugas_masuk_id)
            VALUES (?, ?, ?, ?)`,
            [kendaraan_id, kodeTiket, waktu_masuk, req.user?.id ?? null]
        );

        catatAudit(req, "KENDARAAN_MASUK", "parkir", insertResult.insertId, {
            kode_tiket: kodeTiket,
            kendaraan_id,
            jenis: nama_jenis
        });

        res.status(201).json({
            message: "Data parkir berhasil ditambahkan",
            kode_tiket: kodeTiket
        });

    } catch (err) {

        console.error("[createParkir]", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan pada server"
        });

    }

};

// CREATE (Kendaraan Masuk dari scan kamera)
// Kendaraan yang belum terdaftar otomatis didaftarkan sebagai "Tamu".
exports.masukKamera = async (req, res) => {

    const { plat_nomor, warna, jenis_id, nama_pemilik } = req.body;

    const platBersih = String(plat_nomor || "").trim().toUpperCase();

    if (!platBersih || !warna || !jenis_id) {
        return res.status(400).json({
            message: "Plat nomor, warna, dan jenis kendaraan wajib diisi"
        });
    }

    try {

        // 1. Cari kendaraan berdasarkan plat, kalau belum ada daftarkan sebagai Tamu
        let kendaraanId;

        const ada = await queryAsync(
            "SELECT id FROM kendaraan WHERE UPPER(plat_nomor) = ?",
            [platBersih]
        );

        if (ada.length > 0) {
            kendaraanId = ada[0].id;
        } else {
            const baru = await queryAsync(
                `INSERT INTO kendaraan (plat_nomor, nama_pemilik, warna, jenis_id)
                VALUES (?, ?, ?, ?)`,
                [platBersih, (nama_pemilik || "").trim() || "Tamu", warna, jenis_id]
            );
            kendaraanId = baru.insertId;
        }

        // 2. Cek apakah masih tercatat parkir
        const aktif = await queryAsync(
            `SELECT id FROM parkir WHERE kendaraan_id = ? AND status = 'Parkir'`,
            [kendaraanId]
        );

        if (aktif.length > 0) {
            return res.status(400).json({
                message: "Kendaraan ini masih tercatat sedang parkir"
            });
        }

        // 3. Cek kapasitas berdasarkan jenis kendaraan yang tersimpan
        const jenisRows = await queryAsync(
            `SELECT jenis_kendaraan.id AS jenis_id, jenis_kendaraan.nama_jenis, jenis_kendaraan.kapasitas
            FROM kendaraan
            JOIN jenis_kendaraan ON kendaraan.jenis_id = jenis_kendaraan.id
            WHERE kendaraan.id = ?`,
            [kendaraanId]
        );

        if (jenisRows.length === 0) {
            return res.status(404).json({ message: "Jenis kendaraan tidak ditemukan" });
        }

        const { jenis_id: jenisDb, nama_jenis, kapasitas } = jenisRows[0];

        if (kapasitas !== null && Number(kapasitas) > 0) {
            const terisiRows = await queryAsync(
                `SELECT COUNT(*) AS jumlah
                FROM parkir
                JOIN kendaraan ON parkir.kendaraan_id = kendaraan.id
                WHERE kendaraan.jenis_id = ? AND parkir.status = 'Parkir'`,
                [jenisDb]
            );

            const terisi = terisiRows[0].jumlah;

            if (terisi >= Number(kapasitas)) {
                return res.status(400).json({
                    message: `Slot parkir untuk jenis "${nama_jenis}" sudah penuh (${terisi}/${kapasitas})`
                });
            }
        }

        // 4. Catat parkir masuk
        const kodeTiket = buatKodeTiket();

        const insertResult = await queryAsync(
            `INSERT INTO parkir (kendaraan_id, kode_tiket, waktu_masuk, petugas_masuk_id)
            VALUES (?, ?, ?, ?)`,
            [kendaraanId, kodeTiket, formatSqlLokal(new Date()), req.user?.id ?? null]
        );

        catatAudit(req, "KENDARAAN_MASUK", "parkir", insertResult.insertId, {
            kode_tiket: kodeTiket,
            kendaraan_id: kendaraanId,
            jenis: nama_jenis,
            sumber: "kamera"
        });

        res.status(201).json({
            message: "Data parkir berhasil ditambahkan",
            kode_tiket: kodeTiket
        });

    } catch (err) {

        console.error("[masukKamera]", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan pada server"
        });

    }

};

// GET satu data parkir berdasarkan kode tiket.
// Dipakai untuk fitur scan QR saat kendaraan keluar, supaya petugas
// tidak perlu cari manual dari daftar/plat nomor - cukup scan QR
// yang dicetak saat kendaraan masuk.
exports.getParkirByTiket = async (req, res) => {

    const { kode_tiket } = req.params;

    if (!kode_tiket) {
        return res.status(400).json({
            message: "Kode tiket wajib disertakan"
        });
    }

    try {

        const rows = await queryAsync(
            `SELECT
                parkir.id,
                parkir.kode_tiket,
                kendaraan.plat_nomor,
                kendaraan.nama_pemilik,
                kendaraan.warna,
                jenis_kendaraan.nama_jenis,
                jenis_kendaraan.tarif AS tarif_jenis,
                jenis_kendaraan.mode_tarif,
                jenis_kendaraan.tarif_per_jam,
                parkir.waktu_masuk,
                parkir.waktu_keluar,
                parkir.status,
                parkir.biaya,
                parkir.metode_bayar,
                parkir.uang_diterima,
                parkir.kembalian,
                jenis_kendaraan.gratis_menit,
                jenis_kendaraan.tarif_jam_pertama,
                jenis_kendaraan.tarif_maks_harian,
                petugas_masuk.nama AS petugas_masuk,
                petugas_keluar.nama AS petugas_keluar
            FROM parkir
            JOIN kendaraan
                ON parkir.kendaraan_id = kendaraan.id
            JOIN jenis_kendaraan
                ON kendaraan.jenis_id = jenis_kendaraan.id
            LEFT JOIN users AS petugas_masuk
                ON parkir.petugas_masuk_id = petugas_masuk.id
            LEFT JOIN users AS petugas_keluar
                ON parkir.petugas_keluar_id = petugas_keluar.id
            WHERE parkir.kode_tiket = ?`,
            [kode_tiket.trim()]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Tiket tidak ditemukan. Pastikan QR yang discan benar."
            });
        }

        const dataParkir = rows[0];

        if (dataParkir.status !== "Parkir") {
            return res.status(400).json({
                message: `Tiket ${dataParkir.kode_tiket} sudah diproses keluar sebelumnya`
            });
        }

        res.json({
            message: "Tiket ditemukan",
            data: dataParkir
        });

    } catch (err) {

        console.error("[getParkirByTiket]", err);
        res.status(500).json({
            message: err.message || "Terjadi kesalahan pada server"
        });

    }

};

// READ (server-side pagination & search)
exports.getParkir = (req, res) => {

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const q = (req.query.q || "").trim();

    const whereClause = q
        ? `WHERE kendaraan.plat_nomor LIKE ? OR kendaraan.nama_pemilik LIKE ?`
        : "";
    const whereParams = q ? [`%${q}%`, `%${q}%`] : [];

    db.query(
        `SELECT COUNT(*) AS total
        FROM parkir
        JOIN kendaraan ON parkir.kendaraan_id = kendaraan.id
        ${whereClause}`,
        whereParams,
        (err, countResult) => {

            if (err) {
                return res.status(500).json({ message: err.message });
            }

            const total = countResult[0].total;

            db.query(
                `SELECT
                    parkir.id,
                    parkir.kode_tiket,
                    kendaraan.plat_nomor,
                    kendaraan.nama_pemilik,
                    kendaraan.warna,
                    jenis_kendaraan.nama_jenis,
                    jenis_kendaraan.tarif AS tarif_jenis,
                    jenis_kendaraan.mode_tarif,
                    jenis_kendaraan.tarif_per_jam,
                    parkir.waktu_masuk,
                    parkir.waktu_keluar,
                    parkir.status,
                    parkir.biaya,
                    parkir.metode_bayar,
                    parkir.uang_diterima,
                    parkir.kembalian,
                    jenis_kendaraan.gratis_menit,
                    jenis_kendaraan.tarif_jam_pertama,
                    jenis_kendaraan.tarif_maks_harian,
                    petugas_masuk.nama AS petugas_masuk,
                    petugas_keluar.nama AS petugas_keluar
                FROM parkir
                JOIN kendaraan
                    ON parkir.kendaraan_id = kendaraan.id
                JOIN jenis_kendaraan
                    ON kendaraan.jenis_id = jenis_kendaraan.id
                LEFT JOIN users AS petugas_masuk
                    ON parkir.petugas_masuk_id = petugas_masuk.id
                LEFT JOIN users AS petugas_keluar
                    ON parkir.petugas_keluar_id = petugas_keluar.id
                ${whereClause}
                ORDER BY parkir.id DESC
                LIMIT ? OFFSET ?`,
                [...whereParams, limit, offset],
                (err, result) => {

                    if (err) {
                        return res.status(500).json({ message: err.message });
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

// Mengambil data parkir + aturan tarif jenis kendaraannya.
async function ambilDataParkirUntukKeluar(id) {

    const rows = await queryAsync(
        `SELECT
            parkir.id,
            parkir.waktu_masuk,
            parkir.status,
            parkir.kode_tiket,
            kendaraan.plat_nomor,
            jenis_kendaraan.nama_jenis,
            jenis_kendaraan.tarif,
            jenis_kendaraan.mode_tarif,
            jenis_kendaraan.tarif_per_jam,
            jenis_kendaraan.gratis_menit,
            jenis_kendaraan.tarif_jam_pertama,
            jenis_kendaraan.tarif_maks_harian
        FROM parkir
        JOIN kendaraan
            ON parkir.kendaraan_id = kendaraan.id
        JOIN jenis_kendaraan
            ON kendaraan.jenis_id = jenis_kendaraan.id
        WHERE parkir.id = ?`,
        [id]
    );

    return rows[0] || null;

}

// Parse waktu_keluar dari body/query. Kosong = sekarang.
function parseWaktuKeluar(waktu_keluar) {

    if (!waktu_keluar) return new Date();

    return new Date(String(waktu_keluar).replace(" ", "T"));

}

// PREVIEW biaya sebelum kendaraan diproses keluar.
// Dipakai modal "Proses Kendaraan Keluar" supaya angka yang tampil
// SELALU sama dengan hasil perhitungan backend (termasuk tarif per
// jam, masa gratis, jam pertama, dan batas harian).
exports.previewBiaya = async (req, res) => {

    const { id } = req.params;

    try {

        const dataParkir = await ambilDataParkirUntukKeluar(id);

        if (!dataParkir) {
            return res.status(404).json({
                message: "Data parkir tidak ditemukan"
            });
        }

        const waktuKeluarDate = parseWaktuKeluar(req.query.waktu_keluar);

        if (isNaN(waktuKeluarDate.getTime())) {
            return res.status(400).json({
                message: "Format jam keluar tidak valid"
            });
        }

        if (waktuKeluarDate < keDateAman(dataParkir.waktu_masuk)) {
            return res.status(400).json({
                message: "Jam keluar tidak boleh lebih awal dari jam masuk"
            });
        }

        const totalMenit = hitungTotalMenit(dataParkir.waktu_masuk, waktuKeluarDate);
        const hasil = hitungBiaya(dataParkir, totalMenit);

        if (hasil.error) {
            return res.status(400).json({ message: hasil.error });
        }

        res.json({
            total_menit: totalMenit,
            durasi: formatDurasi(totalMenit),
            biaya: hasil.biaya,
            gratis: hasil.gratis
        });

    } catch (err) {

        console.error("[previewBiaya]", err);
        res.status(500).json({
            message: "Terjadi kesalahan pada server"
        });

    }

};

function keDateAman(nilai) {
    return nilai instanceof Date
        ? nilai
        : new Date(String(nilai).replace(" ", "T"));
}

// UPDATE (Kendaraan Keluar)
exports.updateParkir = async (req, res) => {

    const { id } = req.params;
    const { waktu_keluar, metode_bayar, uang_diterima } = req.body;

    try {

        const dataParkir = await ambilDataParkirUntukKeluar(id);

        if (!dataParkir) {
            return res.status(404).json({
                message: "Data parkir tidak ditemukan"
            });
        }

        if (dataParkir.status !== "Parkir") {
            return res.status(400).json({
                message: "Kendaraan ini sudah diproses keluar sebelumnya"
            });
        }

        const waktuKeluarDate = parseWaktuKeluar(waktu_keluar);

        if (isNaN(waktuKeluarDate.getTime())) {
            return res.status(400).json({
                message: "Format jam keluar tidak valid"
            });
        }

        if (waktuKeluarDate < keDateAman(dataParkir.waktu_masuk)) {
            return res.status(400).json({
                message: "Jam keluar tidak boleh lebih awal dari jam masuk"
            });
        }

        const totalMenit = hitungTotalMenit(dataParkir.waktu_masuk, waktuKeluarDate);
        const durasiText = formatDurasi(totalMenit);

        const hasil = hitungBiaya(dataParkir, totalMenit);

        if (hasil.error) {
            return res.status(400).json({ message: hasil.error });
        }

        const biaya = hasil.biaya;

        // ===========================
        // PEMBAYARAN
        // Tanpa metode_bayar dianggap "tunai" (kompatibel dengan klien
        // lama). Biaya 0 (masa gratis) tidak butuh pembayaran.
        // ===========================
        let metodeFinal = null;
        let uangDiterimaFinal = null;
        let kembalianFinal = null;

        if (biaya > 0) {

            metodeFinal = metode_bayar || "tunai";

            if (!METODE_BAYAR.includes(metodeFinal)) {
                return res.status(400).json({
                    message: "Metode pembayaran tidak valid (tunai, qris, atau transfer)"
                });
            }

            if (metodeFinal === "tunai") {

                const adaUang = uang_diterima !== undefined &&
                    uang_diterima !== null &&
                    uang_diterima !== "";

                if (adaUang) {

                    const uangNum = Number(uang_diterima);

                    if (isNaN(uangNum) || uangNum < 0) {
                        return res.status(400).json({
                            message: "Uang diterima harus berupa angka"
                        });
                    }

                    if (uangNum < biaya) {
                        return res.status(400).json({
                            message: `Uang diterima kurang. Total biaya ${biaya}, uang diterima ${uangNum}`
                        });
                    }

                    uangDiterimaFinal = uangNum;
                    kembalianFinal = uangNum - biaya;

                }

            } else {

                // QRIS / transfer dibayar pas sesuai tagihan.
                uangDiterimaFinal = biaya;
                kembalianFinal = 0;

            }

        }

        const waktuKeluarSql = waktu_keluar
            ? waktu_keluar
            : formatSqlLokal(waktuKeluarDate);

        const result = await queryAsync(
            `UPDATE parkir
            SET
                waktu_keluar = ?,
                status = 'Keluar',
                biaya = ?,
                petugas_keluar_id = ?,
                metode_bayar = ?,
                uang_diterima = ?,
                kembalian = ?
            WHERE id = ? AND status = 'Parkir'`,
            [
                waktuKeluarSql,
                biaya,
                req.user?.id ?? null,
                metodeFinal,
                uangDiterimaFinal,
                kembalianFinal,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "Kendaraan ini sudah diproses keluar sebelumnya"
            });
        }

        catatAudit(req, "KENDARAAN_KELUAR", "parkir", Number(id), {
            kode_tiket: dataParkir.kode_tiket,
            plat_nomor: dataParkir.plat_nomor,
            durasi: durasiText,
            biaya,
            metode_bayar: metodeFinal
        });

        res.json({
            message: "Kendaraan berhasil keluar",
            data: {
                kode_tiket: dataParkir.kode_tiket,
                plat_nomor: dataParkir.plat_nomor,
                jenis_kendaraan: dataParkir.nama_jenis,
                waktu_masuk: dataParkir.waktu_masuk,
                waktu_keluar: waktuKeluarSql,
                durasi: durasiText,
                biaya,
                gratis: hasil.gratis,
                metode_bayar: metodeFinal,
                uang_diterima: uangDiterimaFinal,
                kembalian: kembalianFinal,
                status: "Keluar"
            }
        });

    } catch (err) {

        console.error("[updateParkir]", err);
        res.status(500).json({
            message: err.message
        });

    }

};

// DELETE
exports.deleteParkir = async (req, res) => {

    const { id } = req.params;

    try {

        // Ambil dulu ringkasan datanya supaya bisa dicatat di audit log
        // (setelah dihapus, datanya sudah tidak ada).
        const rows = await queryAsync(
            `SELECT parkir.kode_tiket, parkir.status, parkir.biaya, kendaraan.plat_nomor
            FROM parkir
            JOIN kendaraan ON parkir.kendaraan_id = kendaraan.id
            WHERE parkir.id = ?`,
            [id]
        );

        const result = await queryAsync(
            "DELETE FROM parkir WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Data tidak ditemukan"
            });
        }

        catatAudit(req, "HAPUS_PARKIR", "parkir", Number(id), rows[0] || null);

        res.json({
            message: "Data parkir berhasil dihapus"
        });

    } catch (err) {

        console.error("[deleteParkir]", err);
        res.status(500).json({
            message: err.message
        });

    }

};

const db = require("../config/db");

// Helper: bungkus db.query jadi Promise supaya bisa dipakai
// dengan async/await dan dijalankan paralel (Promise.all)
const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// Helper: format Date jadi "YYYY-MM-DD"
const formatTanggal = (date) => {
    return date.toISOString().slice(0, 10);
};

// Helper: bikin array 7 tanggal terakhir (termasuk hari ini)
const tujuhHariTerakhir = () => {
    const hasil = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        hasil.push(formatTanggal(d));
    }
    return hasil;
};

exports.dashboard = (req, res) => {

    const dashboard = {};

    db.query(
        "SELECT COUNT(*) AS total FROM kendaraan",
        (err, kendaraan) => {

            if (err) return res.status(500).json(err);

            dashboard.total_kendaraan = kendaraan[0].total;

            db.query(
                "SELECT COUNT(*) AS total FROM parkir",
                (err, parkir) => {

                    if (err) return res.status(500).json(err);

                    dashboard.total_parkir = parkir[0].total;

                    db.query(
                        "SELECT COUNT(*) AS total FROM parkir WHERE status='Parkir'",
                        (err, aktif) => {

                            if (err) return res.status(500).json(err);

                            dashboard.sedang_parkir = aktif[0].total;

                            db.query(
                                "SELECT COUNT(*) AS total FROM parkir WHERE status='Keluar'",
                                (err, keluar) => {

                                    if (err) return res.status(500).json(err);

                                    dashboard.sudah_keluar = keluar[0].total;

                                    db.query(
                                        `SELECT
                                            jenis_kendaraan.nama_jenis,
                                            COUNT(*) AS jumlah
                                        FROM kendaraan
                                        JOIN jenis_kendaraan
                                        ON kendaraan.jenis_id = jenis_kendaraan.id
                                        GROUP BY jenis_kendaraan.nama_jenis`,
                                        (err, jenis) => {

                                            if (err)
                                                return res.status(500).json(err);

                                            dashboard.jenis = jenis;

                                            res.json(dashboard);

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );

};

// ===========================
// ANALYTICS (untuk Dashboard Analytics)
// Bar chart, Pie chart, Line chart, Ringkasan, Recent Activity
// ===========================
exports.analytics = async (req, res) => {

    try {

        const tanggalList = tujuhHariTerakhir();

        const [
            masukPerHariRaw,
            keluarPerHariRaw,
            jenisKendaraan,
            ringkasanHariIni,
            ringkasanBulanIni,
            recentActivity
        ] = await Promise.all([

            // Bar/Line chart: kendaraan masuk per hari (7 hari terakhir)
            queryAsync(
                `SELECT DATE(waktu_masuk) AS tanggal, COUNT(*) AS jumlah
                FROM parkir
                WHERE waktu_masuk >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                GROUP BY DATE(waktu_masuk)`
            ),

            // Line chart: kendaraan keluar per hari (7 hari terakhir)
            queryAsync(
                `SELECT DATE(waktu_keluar) AS tanggal, COUNT(*) AS jumlah
                FROM parkir
                WHERE waktu_keluar IS NOT NULL
                AND waktu_keluar >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                GROUP BY DATE(waktu_keluar)`
            ),

            // Pie chart: jumlah kendaraan per jenis
            queryAsync(
                `SELECT
                    jenis_kendaraan.nama_jenis,
                    COUNT(*) AS jumlah
                FROM kendaraan
                JOIN jenis_kendaraan
                ON kendaraan.jenis_id = jenis_kendaraan.id
                GROUP BY jenis_kendaraan.nama_jenis`
            ),

            // Ringkasan kendaraan hari ini
            queryAsync(
                `SELECT COUNT(*) AS total FROM parkir
                WHERE DATE(waktu_masuk) = CURDATE()`
            ),

            // Ringkasan kendaraan bulan ini
            queryAsync(
                `SELECT COUNT(*) AS total FROM parkir
                WHERE MONTH(waktu_masuk) = MONTH(CURDATE())
                AND YEAR(waktu_masuk) = YEAR(CURDATE())`
            ),

            // Recent activity: 5 aktivitas parkir terbaru
            queryAsync(
                `SELECT
                    parkir.id,
                    kendaraan.plat_nomor,
                    kendaraan.nama_pemilik,
                    jenis_kendaraan.nama_jenis,
                    parkir.waktu_masuk,
                    parkir.waktu_keluar,
                    parkir.status
                FROM parkir
                JOIN kendaraan ON parkir.kendaraan_id = kendaraan.id
                JOIN jenis_kendaraan ON kendaraan.jenis_id = jenis_kendaraan.id
                ORDER BY parkir.id DESC
                LIMIT 5`
            )

        ]);

        // Isi tanggal yang tidak ada data dengan 0, supaya chart tetap
        // menampilkan 7 titik/bar walau ada hari kosong
        const isiPerHari = (rows) => {
            return tanggalList.map((tanggal) => {
                const cocok = rows.find(
                    (row) => formatTanggal(new Date(row.tanggal)) === tanggal
                );
                return {
                    tanggal,
                    jumlah: cocok ? cocok.jumlah : 0
                };
            });
        };

        res.json({
            kendaraan_masuk_per_hari: isiPerHari(masukPerHariRaw),
            kendaraan_keluar_per_hari: isiPerHari(keluarPerHariRaw),
            jenis_kendaraan: jenisKendaraan,
            ringkasan_hari_ini: ringkasanHariIni[0].total,
            ringkasan_bulan_ini: ringkasanBulanIni[0].total,
            recent_activity: recentActivity
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

// ===========================
// Helper tanggal untuk PENDAPATAN
// Batas tanggal (hari ini/bulan ini/tahun ini) dihitung di
// Node.js memakai zona waktu Asia/Jakarta (WIB), BUKAN memakai
// CURDATE()/NOW() milik MySQL. Koneksi MySQL di config/db.js
// tidak mengatur timezone secara eksplisit, sehingga
// CURDATE()/NOW() bisa memakai timezone server MySQL yang
// berbeda dari waktu lokal aplikasi -> transaksi "hari ini"
// bisa tidak terhitung (Pendapatan Hari Ini salah).
// Dengan menghitung batas tanggal di Node lalu memakai
// perbandingan rentang (>= awal AND < akhir), hasilnya konsisten
// terlepas dari timezone MySQL, dan tidak ada operasi pengurangan
// tanggal yang berpotensi menghasilkan nilai negatif.
// ===========================
function getJakartaNow() {
    const jakartaString = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Jakarta"
    });
    return new Date(jakartaString);
}

function formatDateTime(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getRevenueDateRanges() {

    const now = getJakartaNow();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    const startOfToday = new Date(y, m, d, 0, 0, 0);
    const startOfTomorrow = new Date(y, m, d + 1, 0, 0, 0);

    const startOfMonth = new Date(y, m, 1, 0, 0, 0);
    const startOfNextMonth = new Date(y, m + 1, 1, 0, 0, 0);

    const startOfYear = new Date(y, 0, 1, 0, 0, 0);
    const startOfNextYear = new Date(y + 1, 0, 1, 0, 0, 0);

    return {
        today: [formatDateTime(startOfToday), formatDateTime(startOfTomorrow)],
        month: [formatDateTime(startOfMonth), formatDateTime(startOfNextMonth)],
        year: [formatDateTime(startOfYear), formatDateTime(startOfNextYear)]
    };

}

// ===========================
// PENDAPATAN (untuk Card Dashboard Pendapatan)
// Hanya menghitung data parkir dengan status "Keluar" (selesai),
// diambil langsung dari kolom biaya yang tersimpan di database.
// ===========================
exports.revenue = async (req, res) => {

    try {

        const ranges = getRevenueDateRanges();

        const [
            todayRows,
            monthRows,
            yearRows,
            activeRows,
            completedRows,
            totalRows
        ] = await Promise.all([

            // Pendapatan hari ini (rentang tanggal, timezone Asia/Jakarta)
            queryAsync(
                `SELECT COALESCE(SUM(biaya), 0) AS total
                FROM parkir
                WHERE status = 'Keluar'
                AND waktu_keluar >= ? AND waktu_keluar < ?`,
                ranges.today
            ),

            // Pendapatan bulan berjalan
            queryAsync(
                `SELECT COALESCE(SUM(biaya), 0) AS total
                FROM parkir
                WHERE status = 'Keluar'
                AND waktu_keluar >= ? AND waktu_keluar < ?`,
                ranges.month
            ),

            // Pendapatan tahun berjalan
            queryAsync(
                `SELECT COALESCE(SUM(biaya), 0) AS total
                FROM parkir
                WHERE status = 'Keluar'
                AND waktu_keluar >= ? AND waktu_keluar < ?`,
                ranges.year
            ),

            // Kendaraan yang masih aktif parkir
            queryAsync(
                `SELECT COUNT(*) AS total FROM parkir WHERE status = 'Parkir'`
            ),

            // Kendaraan yang sudah selesai (keluar)
            queryAsync(
                `SELECT COUNT(*) AS total FROM parkir WHERE status = 'Keluar'`
            ),

            // Total seluruh transaksi parkir
            queryAsync(
                `SELECT COUNT(*) AS total FROM parkir`
            )

        ]);

        res.json({
            today: Number(todayRows[0].total) || 0,
            month: Number(monthRows[0].total) || 0,
            year: Number(yearRows[0].total) || 0,
            activeVehicles: activeRows[0].total,
            completedVehicles: completedRows[0].total,
            totalTransactions: totalRows[0].total
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};
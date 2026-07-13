const db = require("../config/db");

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
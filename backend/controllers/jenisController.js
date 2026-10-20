const db = require("../config/db");

function validasiPayload(body) {

    const {
        nama_jenis, tarif, kapasitas, mode_tarif, tarif_per_jam,
        gratis_menit, tarif_jam_pertama, tarif_maks_harian
    } = body;

    if (!nama_jenis || tarif === undefined || tarif === null || tarif === "") {
        return { error: "Nama jenis dan tarif wajib diisi" };
    }

    const tarifNum = Number(tarif);

    if (isNaN(tarifNum) || tarifNum < 0) {
        return { error: "Tarif harus berupa angka dan tidak boleh negatif" };
    }

    let kapasitasNum = null;

    if (kapasitas !== undefined && kapasitas !== null && kapasitas !== "") {
        kapasitasNum = Number(kapasitas);
        if (isNaN(kapasitasNum) || kapasitasNum < 0) {
            return { error: "Kapasitas harus berupa angka dan tidak boleh negatif" };
        }
    }

    const modeTarifFinal = mode_tarif === "per_jam" ? "per_jam" : "flat";

    let tarifPerJamNum = null;

    if (modeTarifFinal === "per_jam") {

        if (tarif_per_jam === undefined || tarif_per_jam === null || tarif_per_jam === "") {
            return { error: "Tarif per jam wajib diisi jika mode tarif per jam dipilih" };
        }

        tarifPerJamNum = Number(tarif_per_jam);

        if (isNaN(tarifPerJamNum) || tarifPerJamNum < 0) {
            return { error: "Tarif per jam harus berupa angka dan tidak boleh negatif" };
        }

    }

    // ---- Aturan tarif lanjutan (semua opsional) ----
    let gratisMenitNum = 0;

    if (gratis_menit !== undefined && gratis_menit !== null && gratis_menit !== "") {
        gratisMenitNum = Number(gratis_menit);
        if (!Number.isInteger(gratisMenitNum) || gratisMenitNum < 0) {
            return { error: "Masa gratis harus berupa bilangan bulat menit (0 atau lebih)" };
        }
    }

    // Jam pertama & batas harian hanya berlaku di mode per_jam.
    let tarifJamPertamaNum = null;
    let tarifMaksHarianNum = null;

    if (modeTarifFinal === "per_jam") {

        if (tarif_jam_pertama !== undefined && tarif_jam_pertama !== null && tarif_jam_pertama !== "") {
            tarifJamPertamaNum = Number(tarif_jam_pertama);
            if (isNaN(tarifJamPertamaNum) || tarifJamPertamaNum < 0) {
                return { error: "Tarif jam pertama harus berupa angka dan tidak boleh negatif" };
            }
        }

        if (tarif_maks_harian !== undefined && tarif_maks_harian !== null && tarif_maks_harian !== "") {
            tarifMaksHarianNum = Number(tarif_maks_harian);
            if (isNaN(tarifMaksHarianNum) || tarifMaksHarianNum <= 0) {
                return { error: "Tarif maksimum harian harus berupa angka lebih dari 0 (kosongkan jika tanpa batas)" };
            }
        }

    }

    return {
        nama_jenis,
        tarif: tarifNum,
        kapasitas: kapasitasNum,
        mode_tarif: modeTarifFinal,
        tarif_per_jam: tarifPerJamNum,
        gratis_menit: gratisMenitNum,
        tarif_jam_pertama: tarifJamPertamaNum,
        tarif_maks_harian: tarifMaksHarianNum
    };

}

// CREATE
exports.createJenis = (req, res) => {

    const hasil = validasiPayload(req.body);

    if (hasil.error) {
        return res.status(400).json({ message: hasil.error });
    }

    db.query(
        `INSERT INTO jenis_kendaraan
        (nama_jenis, tarif, kapasitas, mode_tarif, tarif_per_jam,
        gratis_menit, tarif_jam_pertama, tarif_maks_harian)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            hasil.nama_jenis, hasil.tarif, hasil.kapasitas, hasil.mode_tarif, hasil.tarif_per_jam,
            hasil.gratis_menit, hasil.tarif_jam_pertama, hasil.tarif_maks_harian
        ],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Terjadi kesalahan pada server"
                });
            }

            res.status(201).json({
                message: "Jenis kendaraan berhasil ditambahkan"
            });

        }
    );

};

// READ — sekaligus menghitung jumlah kendaraan yang SEDANG parkir
// per jenis (terisi), supaya frontend bisa menampilkan sisa slot
// tanpa request tambahan.
exports.getJenis = (req, res) => {

    db.query(
        `SELECT
            jenis_kendaraan.*,
            COALESCE(terisi.jumlah, 0) AS terisi
        FROM jenis_kendaraan
        LEFT JOIN (
            SELECT
                kendaraan.jenis_id,
                COUNT(*) AS jumlah
            FROM parkir
            JOIN kendaraan ON parkir.kendaraan_id = kendaraan.id
            WHERE parkir.status = 'Parkir'
            GROUP BY kendaraan.jenis_id
        ) AS terisi ON terisi.jenis_id = jenis_kendaraan.id`,
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Terjadi kesalahan pada server"
                });
            }

            res.json(result);

        }
    );

};

// UPDATE
exports.updateJenis = (req, res) => {

    const { id } = req.params;
    const hasil = validasiPayload(req.body);

    if (hasil.error) {
        return res.status(400).json({ message: hasil.error });
    }

    db.query(
        `UPDATE jenis_kendaraan
        SET nama_jenis = ?, tarif = ?, kapasitas = ?, mode_tarif = ?, tarif_per_jam = ?,
            gratis_menit = ?, tarif_jam_pertama = ?, tarif_maks_harian = ?
        WHERE id = ?`,
        [
            hasil.nama_jenis, hasil.tarif, hasil.kapasitas, hasil.mode_tarif, hasil.tarif_per_jam,
            hasil.gratis_menit, hasil.tarif_jam_pertama, hasil.tarif_maks_harian, id
        ],
        (err, result) => {

            if (err) {
                console.error(err);
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
                message: "Jenis kendaraan berhasil diubah"
            });

        }
    );

};

// DELETE
exports.deleteJenis = (req, res) => {

    const { id } = req.params;

    db.query(
        "SELECT * FROM kendaraan WHERE jenis_id = ?",
        [id],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Terjadi kesalahan pada server"
                });
            }

            if (result.length > 0) {
                return res.status(400).json({
                    message: "Jenis kendaraan masih digunakan oleh data kendaraan."
                });
            }

            db.query(
                "DELETE FROM jenis_kendaraan WHERE id = ?",
                [id],
                (err, result) => {

                    if (err) {
                        console.error(err);
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
                        message: "Jenis kendaraan berhasil dihapus"
                    });

                }
            );

        }
    );

};

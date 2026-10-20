// Satu-satunya tempat aturan perhitungan biaya parkir. Dipakai oleh
// proses kendaraan keluar (updateParkir) DAN endpoint preview, supaya
// angka yang dilihat petugas sebelum menekan "Keluar" selalu sama
// dengan angka yang akhirnya disimpan.

const TARIF_PARKIR = {
    motor: 2000,
    mobil: 5000,
    bus: 10000,
    truk: 15000
};

function getTarifByJenis(namaJenis) {

    const nama = String(namaJenis || "").toLowerCase();

    if (nama.includes("truk")) return TARIF_PARKIR.truk;
    if (nama.includes("bus")) return TARIF_PARKIR.bus;
    if (nama.includes("mobil")) return TARIF_PARKIR.mobil;
    if (nama.includes("motor")) return TARIF_PARKIR.motor;

    return null;

}

function resolveTarifFlat(tarifJenis, namaJenis) {

    const tarifNum = Number(tarifJenis);

    if (!isNaN(tarifNum) && tarifNum > 0) {
        return tarifNum;
    }

    return getTarifByJenis(namaJenis);

}

function formatDurasi(totalMenit) {

    const jam = Math.floor(totalMenit / 60);
    const menit = totalMenit % 60;

    if (jam > 0 && menit > 0) return `${jam} jam ${menit} menit`;
    if (jam > 0) return `${jam} jam`;

    return `${menit} menit`;

}

// Menerima Date (dari mysql2) maupun string "YYYY-MM-DD HH:mm:ss".
function keDate(nilai) {

    if (nilai instanceof Date) return nilai;

    return new Date(String(nilai).replace(" ", "T"));

}

function hitungTotalMenit(waktuMasuk, waktuKeluarDate) {

    const masuk = keDate(waktuMasuk);

    return Math.max(0, Math.round((waktuKeluarDate - masuk) / 60000));

}

function angkaAtauNull(nilai) {

    if (nilai === null || nilai === undefined || nilai === "") return null;

    const n = Number(nilai);

    return isNaN(n) ? null : n;

}

// Biaya untuk durasi tertentu pada mode per_jam (tanpa batas harian).
// Dibulatkan ke atas per jam; jam pertama boleh punya tarif sendiri.
function biayaPerJam(menit, tarifPerJam, tarifJamPertama) {

    if (menit <= 0) return 0;

    const jam = Math.ceil(menit / 60);

    return tarifJamPertama + (jam - 1) * tarifPerJam;

}

/**
 * hitungBiaya
 * @param {object} jenis  baris jenis_kendaraan (nama_jenis, tarif, mode_tarif,
 *                        tarif_per_jam, gratis_menit, tarif_jam_pertama,
 *                        tarif_maks_harian)
 * @param {number} totalMenit durasi parkir dalam menit
 * @returns {{ biaya: number, gratis: boolean } | { error: string }}
 */
function hitungBiaya(jenis, totalMenit) {

    const gratisMenit = Math.max(0, angkaAtauNull(jenis.gratis_menit) || 0);

    // Masa gratis: durasi sampai batas ini tidak dikenai biaya.
    if (gratisMenit > 0 && totalMenit <= gratisMenit) {
        return { biaya: 0, gratis: true };
    }

    if (jenis.mode_tarif === "per_jam") {

        const tarifPerJam = angkaAtauNull(jenis.tarif_per_jam);

        if (tarifPerJam === null || tarifPerJam <= 0) {
            return {
                error: `Tarif per jam untuk jenis kendaraan "${jenis.nama_jenis}" belum diatur`
            };
        }

        const jamPertamaRaw = angkaAtauNull(jenis.tarif_jam_pertama);
        const tarifJamPertama = jamPertamaRaw === null ? tarifPerJam : jamPertamaRaw;
        const maksHarian = angkaAtauNull(jenis.tarif_maks_harian);
        const adaBatas = maksHarian !== null && maksHarian > 0;

        // Parkir yang sudah lewat gratis tetap dihitung minimal 1 jam,
        // sama seperti aturan sebelumnya.
        const menitHitung = Math.max(1, totalMenit);

        if (!adaBatas) {
            return {
                biaya: biayaPerJam(menitHitung, tarifPerJam, tarifJamPertama),
                gratis: false
            };
        }

        // Dengan batas harian: tiap 24 jam penuh dikenai maksimal
        // `maksHarian`, sisanya dihitung per jam tapi tidak melebihi batas.
        const hariPenuh = Math.floor(menitHitung / 1440);
        const sisaMenit = menitHitung - hariPenuh * 1440;
        const biayaSisa = Math.min(
            maksHarian,
            biayaPerJam(sisaMenit, tarifPerJam, tarifJamPertama)
        );

        return {
            biaya: hariPenuh * maksHarian + biayaSisa,
            gratis: false
        };

    }

    const tarifFlat = resolveTarifFlat(jenis.tarif, jenis.nama_jenis);

    if (tarifFlat === null) {
        return {
            error: `Tarif untuk jenis kendaraan "${jenis.nama_jenis}" belum diatur`
        };
    }

    return { biaya: tarifFlat, gratis: false };

}

module.exports = {
    hitungBiaya,
    hitungTotalMenit,
    formatDurasi,
    keDate,
    resolveTarifFlat,
    getTarifByJenis
};

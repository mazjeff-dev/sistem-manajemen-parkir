<script>

import { onMount, onDestroy, tick } from "svelte";
import { apiFetch } from "../../services/api.js";

import Plus from "lucide-svelte/icons/plus";
import LogOut from "lucide-svelte/icons/log-out";
import Trash2 from "lucide-svelte/icons/trash-2";
import QrCode from "lucide-svelte/icons/qr-code";
import Camera from "lucide-svelte/icons/camera";
import { cetakStruk } from "../../services/cetakStruk.js";

let parkir = $state([]);
let kendaraanList = $state([]);

// Pengaturan cetak otomatis tiket/struk ke printer saat transaksi selesai.
let autoCetak = $state(true);
let search = $state("");

// Pencarian & pagination dilakukan di server, sama seperti halaman
// Kendaraan, supaya tetap ringan walau riwayat parkir sudah banyak.
let currentPage = $state(1);
let totalPages = $state(1);
let totalData = $state(0);
const pageLimit = 10;
let searchDebounce;

// Kendaraan yang boleh dipilih di modal "Tambah Parkir". Karena
// daftar riwayat parkir sekarang dipaginasi di server (tidak lagi
// memuat semua data sekaligus), pengecekan "kendaraan mana yang
// sedang aktif parkir" tidak bisa lagi dilakukan murni di frontend.
// Backend tetap memvalidasi & menolak (dengan pesan error yang
// jelas) kalau kendaraan yang dipilih ternyata masih berstatus
// "Parkir" aktif, jadi seluruh daftar kendaraan ditampilkan di sini.
let kendaraanTersedia = $derived(kendaraanList);

let filteredParkir = $derived(
    parkir.filter((item) =>
        item.plat_nomor.toLowerCase().includes(search.toLowerCase()) ||
        item.nama_pemilik.toLowerCase().includes(search.toLowerCase())
    )
);

function toDatetimeLocal(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Perhitungan biaya SELALU dilakukan backend (services/tarifService.js)
// dan ditampilkan lewat endpoint GET /parkir/:id/preview, supaya angka
// di modal "Proses Kendaraan Keluar" sama persis dengan yang disimpan.

function hitungDurasiText(waktuMasukStr, waktuKeluarLocalStr) {
    const masuk = new Date(String(waktuMasukStr).replace(" ", "T"));
    const keluar = new Date(waktuKeluarLocalStr);

    let totalMenit = Math.round((keluar - masuk) / 60000);
    if (isNaN(totalMenit) || totalMenit < 0) totalMenit = 0;

    const jam = Math.floor(totalMenit / 60);
    const menit = totalMenit % 60;

    if (jam > 0 && menit > 0) return `${jam} jam ${menit} menit`;
    if (jam > 0) return `${jam} jam`;
    return `${menit} menit`;
}

let showModal = $state(false);
let kendaraanId = $state("");
let waktuMasuk = $state(toDatetimeLocal(new Date()));

let showKeluarModal = $state(false);
let keluarItem = $state(null);
let waktuKeluar = $state(toDatetimeLocal(new Date()));

let metodeBayar = $state("tunai");
let uangDiterima = $state("");
let previewData = $state(null);
let previewError = $state("");
let previewLoading = $state(false);
let previewSeq = 0;

let adaUangDiterima = $derived(
    uangDiterima !== "" && uangDiterima !== null && uangDiterima !== undefined
);
let uangKurang = $derived(
    metodeBayar === "tunai" &&
    adaUangDiterima &&
    previewData !== null &&
    Number(uangDiterima) < previewData.biaya
);

async function loadPreview(id, waktuLocal) {

    const seq = ++previewSeq;
    previewLoading = true;

    try {

        const params = new URLSearchParams({
            waktu_keluar: waktuLocal.replace("T", " ") + ":00"
        });

        const response = await apiFetch(`/parkir/${id}/preview?${params.toString()}`);

        if (!response || seq !== previewSeq) return;

        const data = await response.json();

        if (seq !== previewSeq) return;

        if (!response.ok) {
            previewData = null;
            previewError = data.message || "Gagal menghitung biaya";
        } else {
            previewData = data;
            previewError = "";
        }

    } catch (err) {

        if (seq === previewSeq) {
            previewData = null;
            previewError = "Gagal menghitung biaya";
        }

    } finally {

        if (seq === previewSeq) previewLoading = false;

    }

}

// Hitung ulang preview (dengan jeda singkat) tiap jam keluar diubah.
$effect(() => {

    if (!showKeluarModal || !keluarItem) return;

    const id = keluarItem.id;
    const waktu = waktuKeluar;
    const timer = setTimeout(() => loadPreview(id, waktu), 250);

    return () => clearTimeout(timer);

});
let durasiPreview = $derived(
    keluarItem
        ? hitungDurasiText(keluarItem.waktu_masuk, waktuKeluar)
        : "-"
);

let showDeleteModal = $state(false);
let deleteId = $state(null);
let deletePlat = $state("");

// ===========================
// QR TIKET
// QR berisi kode_tiket (bukan seluruh data parkir) supaya ringan
// discan dan tidak membocorkan data lain lewat kode QR.
// ===========================
let showQrModal = $state(false);
let qrItem = $state(null);
let qrDataUrlPreview = $state("");

let showScanModal = $state(false);
let scanError = $state("");
let scanProcessing = $state(false);
let scannerInstance = null;

let toast = $state({
    show: false,
    message: "",
    type: "success"
});
let loading = $state(true);

async function loadParkir(page = currentPage) {

    loading = true;

    try {

        const params = new URLSearchParams({
            page: String(page),
            limit: String(pageLimit)
        });

        if (search.trim()) params.set("q", search.trim());

        const response = await apiFetch(`/parkir?${params.toString()}`);

        if (!response) return;

        const data = await response.json();

        parkir = [...data.data];
        currentPage = data.page;
        totalPages = data.totalPages;
        totalData = data.total;

    } catch (err) {

        console.error(err);
        showToast("Gagal mengambil data", "error");

    } finally {

        loading = false;

    }

}

function handleSearchInput() {

    clearTimeout(searchDebounce);

    searchDebounce = setTimeout(() => {
        loadParkir(1);
    }, 350);

}

function gantiHalaman(page) {

    if (page < 1 || page > totalPages || page === currentPage) return;
    loadParkir(page);

}

async function loadKendaraanList() {

    try {

        // /kendaraan selalu membalas objek berpaginasi ({ data, total,
        // page, ... }), bukan array polos, jadi hasilnya harus diambil
        // dari data.data. limit=100 (maksimum yang diizinkan backend)
        // dipakai supaya dropdown kendaraan di modal "Tambah Parkir"
        // tetap memuat sebanyak mungkin kendaraan, bukan cuma 10 data
        // pertama seperti default paginasi.
        const response = await apiFetch("/kendaraan?limit=100");

        if (!response) return;

        const data = await response.json();

        kendaraanList = [...data.data];

    } catch (err) {

        console.error(err);

    }

}

async function tambahParkir() {

    try {

        const response = await apiFetch("/parkir", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                kendaraan_id: kendaraanId,
                waktu_masuk: waktuMasuk.replace("T", " ") + ":00"
            })

        });

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {

            showToast(data.message, "error");
            return;

        }

        kendaraanId = "";
        waktuMasuk = toDatetimeLocal(new Date());
        showModal = false;

        showToast(data.message);

        await loadParkir();

        cetakTiketBaru(data.kode_tiket);

    } catch (err) {

        console.error(err);
        showToast("Terjadi kesalahan", "error");

    }

}

function bukaKeluar(item) {

    keluarItem = item;
    waktuKeluar = toDatetimeLocal(new Date());
    metodeBayar = "tunai";
    uangDiterima = "";
    previewData = null;
    previewError = "";
    showKeluarModal = true;

}

async function catatKeluar() {

    if (previewError) {
        showToast(previewError, "error");
        return;
    }

    if (uangKurang) {
        showToast("Uang diterima kurang dari total biaya", "error");
        return;
    }

    try {

        const response = await apiFetch(

            `/parkir/${keluarItem.id}`,

            {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                // Biaya TIDAK dikirim dari frontend - tarif tetap
                // dihitung & divalidasi otomatis oleh backend
                // berdasarkan jenis kendaraan.
                body: JSON.stringify({
                    waktu_keluar: waktuKeluar.replace("T", " ") + ":00",
                    metode_bayar: metodeBayar,
                    uang_diterima:
                        metodeBayar === "tunai" && adaUangDiterima
                            ? Number(uangDiterima)
                            : null
                })

            }

        );

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {

            showToast(data.message, "error");
            return;

        }

        // Data struk digabung dari baris yang dipilih + hasil perhitungan
        // backend, dibuat sebelum keluarItem dikosongkan.
        const itemStruk = {
            ...keluarItem,
            ...data.data,
            nama_jenis: keluarItem.nama_jenis,
            status: "Keluar"
        };

        showKeluarModal = false;
        keluarItem = null;

        showToast(
            `Kendaraan berhasil keluar. Total biaya: ${formatBiaya(data.data.biaya)}`
        );

        loadParkir();

        if (autoCetak) {
            cetakAsli(itemStruk, "struk");
        }

    } catch (err) {

        console.error(err);
        showToast("Terjadi kesalahan", "error");

    }

}

function bukaDelete(item) {

    deleteId = item.id;
    deletePlat = item.plat_nomor;
    showDeleteModal = true;

}

async function deleteParkir() {

    try {

        const response = await apiFetch(
            `/parkir/${deleteId}`,
            {
                method: "DELETE"
            }
        );

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {

            showToast(data.message, "error");
            return;

        }

        showDeleteModal = false;
        deleteId = null;
        deletePlat = "";

        showToast("Data parkir berhasil dihapus");

        loadParkir();

    } catch (err) {

        console.error(err);
        showToast("Terjadi kesalahan", "error");

    }

}

function formatWaktu(value) {
    if (!value) return "-";
    return String(value).replace("T", " ").slice(0, 16);
}

function formatBiaya(value) {
    if (value === null || value === undefined || value === "") return "-";
    if (Number(value) === 0) return "Gratis";
    return "Rp" + Number(value).toLocaleString("id-ID");
}

// Nominal uang apa adanya (0 tetap "Rp0"), dipakai untuk kembalian.
function formatUang(value) {
    return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

const LABEL_METODE = {
    tunai: "Tunai",
    qris: "QRIS",
    transfer: "Transfer"
};

function simpanAutoCetak() {
    localStorage.setItem("parkir_auto_cetak", autoCetak ? "1" : "0");
}

// ===========================
// CETAK ASLI KE PRINTER (struk thermal), bukan unduh PDF.
// Layout & cara kerjanya ada di services/cetakStruk.js.
// ===========================
async function cetakAsli(item, jenisDokumen) {

    try {

        const opsi = {};

        if (jenisDokumen === "struk") {
            opsi.durasi = item.durasi ||
                hitungDurasiText(item.waktu_masuk, String(item.waktu_keluar).replace(" ", "T"));
        }

        await cetakStruk(item, jenisDokumen, opsi);

    } catch (err) {

        console.error(err);
        showToast("Gagal mencetak ke printer", "error");

    }

}

// Ambil data lengkap tiket yang baru dibuat lalu cetak otomatis.
async function cetakTiketBaru(kodeTiket) {

    if (!autoCetak || !kodeTiket) return;

    try {

        const response = await apiFetch(`/parkir/tiket/${encodeURIComponent(kodeTiket)}`);

        if (!response) return;

        const data = await response.json();

        if (response.ok) {
            await cetakAsli(data.data, "tiket");
        }

    } catch (err) {

        console.error(err);

    }

}

// Generate QR code (data URL PNG) dari sebuah teks. QR tiket parkir
// cuma berisi kode_tiket-nya sendiri (bukan seluruh data parkir),
// supaya ringan discan dan tidak membocorkan data lain lewat QR.
async function buatQRDataUrl(text) {
    const QRCode = (await import("qrcode")).default;
    return await QRCode.toDataURL(text, {
        margin: 1,
        width: 240
    });
}

// ===========================
// CETAK TIKET (saat kendaraan masuk) & STRUK (saat kendaraan keluar)
// Dibuat langsung di browser pakai jsPDF (sudah dipakai juga di
// halaman Laporan untuk export PDF), jadi tidak perlu endpoint
// backend tambahan. Khusus tiket masuk, QR kode_tiket ikut dicetak
// supaya bisa discan langsung saat kendaraan keluar.
// ===========================
async function cetakDokumen(item, jenisDokumen) {

    const { default: jsPDF } = await import("jspdf");

    let qrDataUrl = null;

    if (jenisDokumen === "tiket" && item.kode_tiket) {
        try {
            qrDataUrl = await buatQRDataUrl(item.kode_tiket);
        } catch (err) {
            console.error("Gagal membuat QR code:", err);
        }
    }

    const doc = new jsPDF({
        unit: "mm",
        format: [80, jenisDokumen === "struk" ? 150 : (qrDataUrl ? 130 : 100)]
    });

    const lebar = 80;
    let y = 10;

    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text("SISTEM MANAJEMEN PARKIR", lebar / 2, y, { align: "center" });

    y += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.text(
        jenisDokumen === "struk" ? "STRUK PEMBAYARAN PARKIR" : "TIKET MASUK PARKIR",
        lebar / 2,
        y,
        { align: "center" }
    );

    y += 4;
    doc.setLineWidth(0.2);
    doc.line(5, y, lebar - 5, y);

    y += 6;
    doc.setFontSize(9);

    const baris = (label, value) => {
        doc.text(label, 6, y);
        doc.text(String(value ?? "-"), lebar - 6, y, { align: "right" });
        y += 6;
    };

    baris("Kode Tiket", item.kode_tiket || "-");
    baris("Plat Nomor", item.plat_nomor);
    if (item.warna) baris("Warna", item.warna);
    baris("Pemilik", item.nama_pemilik);
    baris("Jenis", item.nama_jenis);
    baris("Jam Masuk", formatWaktu(item.waktu_masuk));

    if (jenisDokumen === "struk") {
        baris("Jam Keluar", formatWaktu(item.waktu_keluar));
        baris("Durasi", hitungDurasiText(item.waktu_masuk, String(item.waktu_keluar).replace(" ", "T")));
        doc.line(5, y, lebar - 5, y);
        y += 6;
        doc.setFont(undefined, "bold");
        baris("TOTAL BAYAR", formatBiaya(item.biaya));
        doc.setFont(undefined, "normal");

        if (item.metode_bayar) {
            baris("Metode Bayar", LABEL_METODE[item.metode_bayar] || item.metode_bayar);

            if (item.metode_bayar === "tunai" && item.uang_diterima !== null && item.uang_diterima !== undefined) {
                baris("Uang Diterima", formatUang(item.uang_diterima));
                baris("Kembalian", formatUang(item.kembalian));
            }
        }

        if (item.petugas_keluar) {
            baris("Petugas", item.petugas_keluar);
        }
    }

    if (jenisDokumen === "tiket" && qrDataUrl) {
        y += 2;
        const ukuranQr = 34;
        doc.addImage(qrDataUrl, "PNG", (lebar - ukuranQr) / 2, y, ukuranQr, ukuranQr);
        y += ukuranQr + 4;
        doc.setFontSize(8);
        doc.setFont(undefined, "normal");
        doc.text("Scan QR ini saat kendaraan keluar", lebar / 2, y, { align: "center" });
        y += 2;
    }

    y += 4;
    doc.setLineWidth(0.2);
    doc.line(5, y, lebar - 5, y);

    y += 6;
    doc.setFontSize(8);
    doc.setFont(undefined, "italic");
    doc.text(
        jenisDokumen === "struk"
            ? "Terima kasih, simpan struk ini sebagai bukti pembayaran."
            : "Simpan tiket ini, tunjukkan saat kendaraan keluar.",
        lebar / 2,
        y,
        { align: "center", maxWidth: lebar - 12 }
    );

    doc.save(`${jenisDokumen}-${item.kode_tiket || item.plat_nomor}.pdf`);

}

// ===========================
// PREVIEW QR (tanpa perlu cetak PDF)
// ===========================
async function bukaQr(item) {

    qrItem = item;
    qrDataUrlPreview = "";
    showQrModal = true;

    try {
        qrDataUrlPreview = await buatQRDataUrl(item.kode_tiket);
    } catch (err) {
        console.error("Gagal membuat QR code:", err);
    }

}

function tutupQr() {
    showQrModal = false;
    qrItem = null;
    qrDataUrlPreview = "";
}

// ===========================
// SCAN QR (kendaraan keluar)
// Pakai kamera device lewat library html5-qrcode. Hasil scan
// (kode_tiket) dicocokkan ke backend, kalau ketemu & masih aktif
// parkir, langsung buka modal proses keluar yang sudah ada -
// petugas tidak perlu cari manual dari daftar/plat nomor.
// ===========================
async function bukaScan() {

    scanError = "";
    scanProcessing = false;
    showScanModal = true;

    // Tunggu modal (dan elemen #qr-reader di dalamnya) selesai
    // dirender ke DOM sebelum kamera diinisialisasi.
    await tick();

    try {

        const { Html5Qrcode } = await import("html5-qrcode");
        scannerInstance = new Html5Qrcode("qr-reader");

        await scannerInstance.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 220 },
            handleScanSuccess,
            () => {} // callback error per-frame ("QR tidak terdeteksi di frame ini") - diabaikan
        );

    } catch (err) {

        console.error("Gagal mengakses kamera:", err);
        scanError = "Tidak bisa mengakses kamera. Pastikan izin kamera sudah diaktifkan di browser.";

    }

}

async function handleScanSuccess(decodedText) {

    if (scanProcessing) return;
    scanProcessing = true;
    scanError = "";

    try {

        const kodeTiket = String(decodedText || "").trim();

        const response = await apiFetch(`/parkir/tiket/${encodeURIComponent(kodeTiket)}`);

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            scanError = data.message || "Tiket tidak ditemukan";
            scanProcessing = false;
            return;
        }

        await tutupScan();
        bukaKeluar(data.data);

    } catch (err) {

        console.error(err);
        scanError = "Terjadi kesalahan saat memproses hasil scan";
        scanProcessing = false;

    }

}

async function tutupScan() {

    if (scannerInstance) {

        try {
            await scannerInstance.stop();
            scannerInstance.clear();
        } catch (err) {
            console.error(err);
        }

        scannerInstance = null;

    }

    showScanModal = false;
    scanError = "";
    scanProcessing = false;

}

function showToast(message, type = "success") {

    toast.show = true;
    toast.message = message;
    toast.type = type;

    setTimeout(() => {
        toast.show = false;
    }, 3000);

}

onMount(() => {
    autoCetak = localStorage.getItem("parkir_auto_cetak") !== "0";
    loadKendaraanList();
    loadParkir();
});

onDestroy(() => {
    if (scannerInstance) {
        scannerInstance.stop().catch(() => {});
    }
});

</script>

<div class="page">

    <h1 class="text-3xl font-bold text-slate-800">Parkir</h1>

            <p class="total-data">
                Total Data :
                <b>{totalData}</b>
            </p>

            <div class="toolbar">

                <div class="toolbar-left">

                    <input
                        type="text"
                        bind:value={search}
                        oninput={handleSearchInput}
                        placeholder="🔍 Cari plat nomor / pemilik..."
                    />

                    <button class="scan-btn" onclick={bukaScan}>
                        <Camera size={16}/>
                        Scan QR Keluar
                    </button>

                    <label class="auto-cetak" title="Tiket dicetak otomatis saat masuk, struk saat keluar">
                        <input type="checkbox" bind:checked={autoCetak} onchange={simpanAutoCetak} />
                        Cetak otomatis
                    </label>

                </div>

                <button onclick={() => {
                    kendaraanId = "";
                    waktuMasuk = toDatetimeLocal(new Date());
                    showModal = true;
                }}>
                    <Plus size={16}/>
                    Catat Kendaraan Masuk
                </button>

            </div>

            {#if loading}

                <div class="loading">
                    Memuat data...
                </div>

            {:else}

            <table>

                <thead>
                    <tr>
                        <th>No</th>
                        <th>Plat Nomor</th>
                        <th>Pemilik</th>
                        <th>Jenis</th>
                        <th>Masuk</th>
                        <th>Keluar</th>
                        <th>Status</th>
                        <th>Biaya</th>
                        <th>Petugas</th>
                        <th>Aksi</th>
                    </tr>
                </thead>

                <tbody>

                {#if parkir.length === 0}

                <tr>
                    <td colspan="10" class="empty">
                        Data tidak ditemukan
                    </td>
                </tr>

                {:else}

                {#each parkir as item, index}

                <tr class="row-anim" style="animation-delay:{index * 0.05}s">
                    <td>{(currentPage - 1) * pageLimit + index + 1}</td>
                    <td>{item.plat_nomor}</td>
                    <td>{item.nama_pemilik}</td>
                    <td>{item.nama_jenis}</td>
                    <td>{formatWaktu(item.waktu_masuk)}</td>
                    <td>{formatWaktu(item.waktu_keluar)}</td>
                    <td>
                        <span class="badge {item.status === 'Parkir' ? 'active' : 'done'}">
                            {item.status}
                        </span>
                    </td>
                    <td>{formatBiaya(item.biaya)}</td>
                    <td>
                        <div class="petugas-cell">
                            <span title="Petugas masuk">&darr; {item.petugas_masuk || "-"}</span>
                            {#if item.status !== "Parkir"}
                                <span title="Petugas keluar">&uarr; {item.petugas_keluar || "-"}</span>
                            {/if}
                        </div>
                    </td>
                    <td>
                        <div class="row-actions">

                        {#if item.status === "Parkir"}
                            <button class="keluar" onclick={() => bukaKeluar(item)}>
                                <LogOut size={16}/>
                                Keluar
                            </button>
                            <button class="cetak" onclick={() => cetakAsli(item, "tiket")}>
                                Cetak Tiket
                            </button>
                            <button class="qr-btn" onclick={() => bukaQr(item)}>
                                <QrCode size={16}/>
                                QR
                            </button>
                        {:else}
                            <button class="cetak" onclick={() => cetakAsli(item, "struk")}>
                                Cetak Struk
                            </button>
                            <button class="cetak pdf" onclick={() => cetakDokumen(item, "struk")}>
                                PDF
                            </button>
                        {/if}

                        <button class="delete" onclick={() => bukaDelete(item)}>
                            <Trash2 size={16}/>
                            Delete
                        </button>

                        </div>
                    </td>
                </tr>

                {/each}

                {/if}

                </tbody>

            </table>

            {#if totalPages > 1}
                <div class="pagination">
                    <button onclick={() => gantiHalaman(currentPage - 1)} disabled={currentPage === 1}>
                        &laquo; Sebelumnya
                    </button>
                    <span class="page-info">Halaman {currentPage} dari {totalPages}</span>
                    <button onclick={() => gantiHalaman(currentPage + 1)} disabled={currentPage === totalPages}>
                        Berikutnya &raquo;
                    </button>
                </div>
            {/if}

            {#if showDeleteModal}

            <div class="modal">

                <div class="delete-card">

                    <div class="icon">🗑️</div>

                    <h2>Hapus Data?</h2>

                    <p>
                        Apakah Anda yakin ingin menghapus data parkir
                        <b>{deletePlat}</b>?
                    </p>

                    <div class="action">

                        <button class="cancel" onclick={() => {
                            showDeleteModal = false;
                            deleteId = null;
                            deletePlat = "";
                        }}>
                            Batal
                        </button>

                        <button class="danger" onclick={deleteParkir}>
                            Ya, Hapus
                        </button>

                    </div>

                </div>

            </div>

            {/if}

            {#if showModal}

            <div class="modal">

                <div class="modal-content">

                    <h2>Catat Kendaraan Masuk</h2>

                    <select bind:value={kendaraanId}>
                        <option value="" disabled>Pilih kendaraan</option>
                        {#each kendaraanTersedia as item}
                            <option value={item.id}>{item.plat_nomor} - {item.nama_pemilik}</option>
                        {/each}
                    </select>
                    {#if kendaraanList.length > 0 && kendaraanTersedia.length === 0}
                        <p class="hint-empty">Semua kendaraan sedang parkir</p>
                    {/if}

                    <input
                        type="datetime-local"
                        bind:value={waktuMasuk}
                    />

                    <div class="action">

                        <button class="cancel" onclick={() => showModal = false}>
                            Batal
                        </button>

                        <button class="save" onclick={tambahParkir}>
                            Simpan
                        </button>

                    </div>

                </div>

            </div>

            {/if}

            {#if showKeluarModal && keluarItem}

            <div class="modal">

                <div class="modal-content">

                    <h2>🚗 Proses Kendaraan Keluar</h2>

                    <div class="keluar-detail">

                        <div class="detail-row">
                            <span>Plat Nomor</span>
                            <b>{keluarItem.plat_nomor}</b>
                        </div>

                        <div class="detail-row">
                            <span>Jenis</span>
                            <b>{keluarItem.nama_jenis}</b>
                        </div>

                        <div class="detail-row">
                            <span>Jam Masuk</span>
                            <b>{formatWaktu(keluarItem.waktu_masuk)}</b>
                        </div>

                        <div class="detail-row">
                            <span>Jam Keluar</span>
                            <b>{formatWaktu(waktuKeluar.replace("T", " "))}</b>
                        </div>

                        <div class="detail-row">
                            <span>Durasi</span>
                            <b>{previewData?.durasi ?? durasiPreview}</b>
                        </div>

                        {#if previewData?.gratis}
                            <div class="detail-row">
                                <span>Keterangan</span>
                                <b>Masih dalam masa gratis</b>
                            </div>
                        {/if}

                        <div class="detail-row total">
                            <span>Total Biaya</span>
                            <b>{previewError ? "-" : formatBiaya(previewData?.biaya)}</b>
                        </div>

                    </div>

                    <input
                        type="datetime-local"
                        bind:value={waktuKeluar}
                    />

                    {#if previewError}
                        <p class="preview-error">{previewError}</p>
                    {/if}

                    {#if previewData && previewData.biaya > 0}

                        <label class="field-label" for="metode-bayar">Metode Pembayaran</label>
                        <select id="metode-bayar" bind:value={metodeBayar}>
                            <option value="tunai">Tunai</option>
                            <option value="qris">QRIS</option>
                            <option value="transfer">Transfer</option>
                        </select>

                        {#if metodeBayar === "tunai"}

                            <input
                                type="number"
                                min="0"
                                step="1000"
                                bind:value={uangDiterima}
                                placeholder="Uang diterima (Rp) - opsional"
                            />

                            {#if adaUangDiterima}
                                {#if uangKurang}
                                    <div class="kembalian kurang">
                                        Uang diterima kurang {formatUang(previewData.biaya - Number(uangDiterima))}
                                    </div>
                                {:else}
                                    <div class="kembalian">
                                        Kembalian: <b>{formatUang(Number(uangDiterima) - previewData.biaya)}</b>
                                    </div>
                                {/if}
                            {/if}

                        {/if}

                    {/if}

                    <div class="action">

                        <button class="cancel" onclick={() => {
                            showKeluarModal = false;
                            keluarItem = null;
                        }}>
                            Batal
                        </button>

                        <button
                            class="save"
                            onclick={catatKeluar}
                            disabled={previewLoading || !!previewError || !previewData || uangKurang}
                        >
                            Proses Kendaraan Keluar
                        </button>

                    </div>

                </div>

            </div>

            {/if}

            {#if showQrModal && qrItem}

            <div class="modal">

                <div class="modal-content qr-modal">

                    <h2>Tiket Parkir</h2>

                    <p class="qr-caption">
                        {qrItem.plat_nomor} — {qrItem.kode_tiket || "-"}
                    </p>

                    {#if qrDataUrlPreview}
                        <img src={qrDataUrlPreview} alt="QR Tiket {qrItem.kode_tiket}" class="qr-preview" />
                    {:else}
                        <p class="qr-loading">Membuat QR...</p>
                    {/if}

                    <p class="qr-hint">Tunjukkan/scan QR ini saat kendaraan keluar.</p>

                    <div class="action">

                        <button class="cancel" onclick={tutupQr}>
                            Tutup
                        </button>

                        <button class="pdf-btn" onclick={() => cetakDokumen(qrItem, "tiket")}>
                            Unduh PDF
                        </button>

                        <button class="save" onclick={() => cetakAsli(qrItem, "tiket")}>
                            Cetak
                        </button>

                    </div>

                </div>

            </div>

            {/if}

            {#if showScanModal}

            <div class="modal">

                <div class="modal-content">

                    <h2>📷 Scan QR Tiket</h2>

                    <div id="qr-reader" class="qr-reader-box"></div>

                    {#if scanProcessing}
                        <p class="qr-hint">Memproses hasil scan...</p>
                    {/if}

                    {#if scanError}
                        <p class="hint-empty">{scanError}</p>
                    {/if}

                    <div class="action">

                        <button class="cancel" onclick={tutupScan}>
                            Tutup
                        </button>

                    </div>

                </div>

            </div>

            {/if}

            {#if toast.show}

                <div class="toast {toast.type}">
                    {toast.message}
                </div>

            {/if}

            {/if}

</div>

<style>

.page{
    padding:35px;
    animation:pageFade .5s ease;
}

.page h1{
    margin-bottom:20px;
    font-size:36px;
    line-height:1.2;
    color:#0f172a;
}

button{
    background:#2563eb;
    color:white;
    padding:12px 20px;
    border:none;
    border-radius:10px;
    cursor:pointer;
    display:inline-flex;
    align-items:center;
    gap:6px;
    transition:transform .2s, background .2s, box-shadow .2s;
}

button:hover{
    background:#1d4ed8;
    transform:translateY(-2px);
    box-shadow:0 8px 16px rgba(37,99,235,.25);
}

button:active{
    transform:translateY(0) scale(.97);
}

table{
    width:100%;
    margin-top:25px;
    border-collapse:collapse;
    background:white;
    border-radius:12px;
    overflow:hidden;
    box-shadow:0 5px 15px rgba(0,0,0,.08);
    animation:tableFade .5s ease .1s both;
}

.row-anim{
    opacity:0;
    animation:rowIn .4s ease forwards;
}

@keyframes rowIn{
    from{
        opacity:0;
        transform:translateX(-15px);
    }
    to{
        opacity:1;
        transform:translateX(0);
    }
}

@keyframes tableFade{
    from{
        opacity:0;
        transform:translateY(15px);
    }
    to{
        opacity:1;
        transform:translateY(0);
    }
}

@keyframes pageFade{
    from{
        opacity:0;
        transform:translateY(10px);
    }
    to{
        opacity:1;
        transform:translateY(0);
    }
}

th{
    background:#2563eb;
    color:white;
    padding:15px;
    text-align:left;
    font-size:14px;
}

td{
    padding:15px;
    border-bottom:1px solid #eee;
    font-size:14px;
}

tr:hover{
    background:#f8fafc;
    transition:background .2s;
}

.keluar{
    background:#ea580c;
    color:white;
    margin-right:8px;
}

.keluar:hover{
    background:#c2410c;
}

.cetak{
    background:#0f172a;
    color:white;
    margin-right:8px;
}

.cetak:hover{
    background:#1e293b;
}

.qr-btn{
    background:#7c3aed;
    color:white;
    margin-right:8px;
}

.qr-btn:hover{
    background:#6d28d9;
}

.scan-btn{
    background:#0f172a;
}

.auto-cetak{
    display:flex;
    align-items:center;
    gap:6px;
    font-size:13px;
    color:#475569;
    white-space:nowrap;
    cursor:pointer;
}

.toolbar .auto-cetak input[type="checkbox"]{
    width:auto;
    padding:0;
    margin:0;
}

.cetak.pdf,
.pdf-btn{
    background:#64748b;
}

.scan-btn:hover{
    background:#1e293b;
}

.qr-modal{
    text-align:center;
}

.qr-caption{
    color:#334155;
    font-weight:600;
    margin-top:6px;
}

.qr-preview{
    width:200px;
    height:200px;
    margin:16px auto;
    display:block;
    border-radius:12px;
    border:1px solid #e2e8f0;
    padding:10px;
}

.qr-loading{
    padding:60px 0;
    color:#94a3b8;
}

.qr-hint{
    color:#64748b;
    font-size:13px;
}

.qr-reader-box{
    margin-top:16px;
    border-radius:12px;
    overflow:hidden;
    min-height:250px;
    background:#0f172a;
}

.row-actions{
    display:flex;
    flex-wrap:wrap;
    gap:8px;
}

.row-actions button{
    margin-right:0;
    padding:8px 12px;
    font-size:13px;
    white-space:nowrap;
}

.delete{
    background:#dc2626;
    color:white;
}

.badge{
    padding:5px 12px;
    border-radius:20px;
    font-weight:600;
    font-size:13px;
    color:white;
}

.badge.active{
    background:#ea580c;
    animation:pulseBadge 1.6s ease infinite;
}

@keyframes pulseBadge{
    0%, 100%{
        box-shadow:0 0 0 0 rgba(234,88,12,.4);
    }
    50%{
        box-shadow:0 0 0 6px rgba(234,88,12,0);
    }
}

.badge.done{
    background:#16a34a;
}

.modal{
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.45);
    display:flex;
    justify-content:center;
    align-items:center;
}

.modal-content{
    width:420px;
    background:white;
    border-radius:16px;
    padding:25px;
    animation:popup .25s;
}

.keluar-detail{
    margin-top:15px;
    background:#f8fafc;
    border-radius:12px;
    padding:14px 16px;
    display:flex;
    flex-direction:column;
    gap:10px;
}

.detail-row{
    display:flex;
    justify-content:space-between;
    align-items:center;
    font-size:14px;
    color:#334155;
}

.detail-row span{
    color:#64748b;
}

.detail-row.total{
    border-top:1px dashed #cbd5e1;
    padding-top:10px;
    margin-top:2px;
    font-size:16px;
}

.detail-row.total b{
    color:#16a34a;
}

.modal-content input,
.modal-content select{
    width:100%;
    margin-top:20px;
    padding:12px;
    border:1px solid #ddd;
    border-radius:10px;
    font-size:15px;
}

.hint-empty{
    margin-top:8px;
    font-size:13px;
    color:#b91c1c;
}

.action{
    display:flex;
    justify-content:flex-end;
    gap:10px;
    margin-top:20px;
}

.cancel{
    background:#64748b;
}

.save:disabled{
    opacity: .5;
    cursor: not-allowed;
}

.field-label{
    display: block;
    margin: 10px 0 4px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
}

.preview-error{
    margin: 8px 0 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: #fef2f2;
    color: #b91c1c;
    font-size: 13px;
}

.kembalian{
    margin-top: 6px;
    padding: 8px 10px;
    border-radius: 8px;
    background: #f0fdf4;
    color: #166534;
    font-size: 14px;
}

.kembalian.kurang{
    background: #fef2f2;
    color: #b91c1c;
}

.petugas-cell{
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    color: #475569;
    white-space: nowrap;
}

.save{
    background:#16a34a;
}

.delete-card{
    width:420px;
    background:white;
    border-radius:18px;
    padding:30px;
    text-align:center;
    animation:popup .25s ease;
    box-shadow:0 15px 35px rgba(0,0,0,.2);
}

.icon{
    font-size:60px;
    margin-bottom:15px;
}

.delete-card h2{
    margin-bottom:10px;
    color:#0f172a;
}

.delete-card p{
    color:#64748b;
    line-height:1.6;
}

.danger{
    background:#dc2626;
    color:white;
}

.danger:hover{
    background:#b91c1c;
}

@keyframes popup{
    from{
        opacity:0;
        transform:scale(.8);
    }
    to{
        opacity:1;
        transform:scale(1);
    }
}

.toast{
    position:fixed;
    top:25px;
    right:25px;
    padding:16px 22px;
    border-radius:12px;
    color:white;
    font-weight:600;
    animation:slideToast .35s ease;
    z-index:9999;
    box-shadow:0 10px 30px rgba(0,0,0,.25);
}

.success{
    background:#16a34a;
}

.error{
    background:#dc2626;
}

@keyframes slideToast{
    from{
        opacity:0;
        transform:translateX(80px);
    }
    to{
        opacity:1;
        transform:translateX(0);
    }
}

.pagination{
    display:flex;
    align-items:center;
    justify-content:center;
    gap:16px;
    margin-top:18px;
}

.pagination button{
    padding:8px 16px;
    border:1px solid #dbe3ef;
    background:white;
    border-radius:8px;
    cursor:pointer;
    font-size:14px;
    color:#334155;
    transition:.2s;
}

.pagination button:hover:not(:disabled){
    background:#2563eb;
    color:white;
    border-color:#2563eb;
}

.pagination button:disabled{
    opacity:.5;
    cursor:not-allowed;
}

.page-info{
    font-size:14px;
    color:#64748b;
}

.toolbar{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:20px;
    gap:20px;
}

.toolbar-left{
    display:flex;
    align-items:center;
    gap:12px;
}

.toolbar input{
    width:300px;
    padding:12px 15px;
    border:1px solid #dbe3ef;
    border-radius:10px;
    outline:none;
    font-size:15px;
}

.toolbar input:focus{
    border-color:#2563eb;
    box-shadow:0 0 0 4px rgba(37,99,235,.15);
}

.total-data{
    color:#64748b;
    margin-bottom:15px;
}

.empty{
    text-align:center;
    padding:40px;
    color:#94a3b8;
}

.loading{
    text-align:center;
    padding:60px;
    color:#64748b;
}

</style>

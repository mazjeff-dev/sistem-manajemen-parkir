<script>

import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { logout } from "../../stores/auth.js";
import { fetchLaporan } from "../../services/laporanService.js";

import {
    Search,
    Filter,
    RotateCcw,
    Eye,
    X,
    Car,
    ChevronLeft,
    ChevronRight,
    FileText,
    FileDown,
    FileSpreadsheet,
    Printer
} from "lucide-svelte";

// ===========================
// State
// ===========================

let laporan = $state([]);
let loading = $state(true);
let search = $state("");

// Filter tanggal (nilai input, belum tentu sudah diterapkan)
let filterStart = $state("");
let filterEnd = $state("");

// Pagination
let currentPage = $state(1);
const itemsPerPage = 8;

// Modal detail
let showDetailModal = $state(false);
let selectedItem = $state(null);

// Export
let exportingPdf = $state(false);
let exportingExcel = $state(false);

// Toast notification
let toast = $state({
    show: false,
    message: "",
    type: "success"
});

// ===========================
// Derived
// ===========================

// Pencarian realtime di sisi client (plat nomor, pemilik, jenis kendaraan)
let filteredLaporan = $derived(
    laporan.filter((item) => {
        const keyword = search.toLowerCase();
        return (
            item.plat_nomor?.toLowerCase().includes(keyword) ||
            item.nama_pemilik?.toLowerCase().includes(keyword) ||
            item.nama_jenis?.toLowerCase().includes(keyword)
        );
    })
);

let totalPages = $derived(
    Math.max(1, Math.ceil(filteredLaporan.length / itemsPerPage))
);

let paginatedLaporan = $derived(
    filteredLaporan.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )
);

// Nomor halaman yang ditampilkan (maks 5 tombol, digeser mengikuti halaman aktif)
let pageNumbers = $derived.by(() => {

    const pages = [];
    const maxButtons = 5;

    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);

    start = Math.max(1, end - maxButtons + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return pages;

});

// Reset ke halaman 1 setiap kali pencarian atau data berubah
$effect(() => {
    search;
    laporan;
    currentPage = 1;
});

// ===========================
// Auth helper
// ===========================

function handleUnauthorized() {
    logout();
    goto("/");
}

// ===========================
// Load data
// ===========================

// Mengambil data laporan dari server, opsional dengan rentang tanggal
async function loadLaporan(start = "", end = "") {

    loading = true;

    try {

        const token = localStorage.getItem("token");

        if (!token) {
            handleUnauthorized();
            return;
        }

        const response = await fetchLaporan(token, { start, end });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            console.error(data.message);
            laporan = [];
            return;
        }

        laporan = [...data];

    } catch (err) {

        console.error(err);
        laporan = [];

    } finally {

        loading = false;

    }

}

// ===========================
// Filter actions
// ===========================

function applyFilter() {
    loadLaporan(filterStart, filterEnd);
}

function resetFilter() {
    filterStart = "";
    filterEnd = "";
    search = "";
    loadLaporan();
}

// ===========================
// Detail modal
// ===========================

function openDetail(item) {
    selectedItem = item;
    showDetailModal = true;
}

function closeDetail() {
    showDetailModal = false;
    selectedItem = null;
}

// ===========================
// Formatter
// ===========================

// Badge status: memetakan status mentah dari database
// ke label & warna yang konsisten dengan tampilan laporan
function statusBadge(status) {

    if (status === "Keluar") {
        return { label: "Selesai", cls: "selesai" };
    }

    if (status === "Dibatalkan") {
        return { label: "Dibatalkan", cls: "dibatalkan" };
    }

    // Default: kendaraan masih di dalam area parkir ("Parkir")
    return { label: "Aktif", cls: "aktif" };

}

function formatWaktu(value) {
    if (!value) return "-";
    return String(value).replace("T", " ").slice(0, 16);
}

function formatBiaya(value) {
    if (!value) return "-";
    return "Rp " + Number(value).toLocaleString("id-ID");
}

function formatDurasi(menit) {

    if (menit === null || menit === undefined) return "Sedang berjalan";

    const jam = Math.floor(menit / 60);
    const sisaMenit = menit % 60;

    if (jam > 0) return `${jam}j ${sisaMenit}m`;

    return `${sisaMenit}m`;

}

// ===========================
// Toast
// ===========================

function showToast(message, type = "success") {

    toast.show = true;
    toast.message = message;
    toast.type = type;

    setTimeout(() => {
        toast.show = false;
    }, 3000);

}

// ===========================
// Export & Print
// ===========================

// Teks periode laporan, mengikuti filter tanggal yang sedang aktif
function periodeText() {
    if (filterStart && filterEnd) return `${filterStart} s/d ${filterEnd}`;
    if (filterStart) return `Mulai ${filterStart}`;
    if (filterEnd) return `Sampai ${filterEnd}`;
    return "Semua Data";
}

// Baris tabel laporan (data yang sedang ditampilkan/hasil filter & search)
function buildRows() {
    return filteredLaporan.map((item, index) => {
        const badge = statusBadge(item.status);
        return [
            index + 1,
            item.plat_nomor || "-",
            item.nama_jenis || "-",
            item.nama_pemilik || "-",
            formatWaktu(item.waktu_masuk),
            formatWaktu(item.waktu_keluar),
            formatDurasi(item.durasi_menit),
            formatBiaya(item.biaya),
            badge.label
        ];
    });
}

async function exportPDF() {

    if (filteredLaporan.length === 0) {
        showToast("Tidak ada data untuk diekspor", "error");
        return;
    }

    exportingPdf = true;

    try {

        const { default: jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");

        const doc = new jsPDF({ orientation: "landscape" });
        const tanggalLaporan = new Date().toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

        doc.setFontSize(16);
        doc.setFont(undefined, "bold");
        doc.text("SISTEM MANAJEMEN PARKIR", 14, 15);

        doc.setFontSize(12);
        doc.text("LAPORAN PARKIR", 14, 22);

        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        doc.text(`Tanggal Laporan : ${tanggalLaporan}`, 14, 29);
        doc.text(`Periode Laporan : ${periodeText()}`, 14, 34);
        doc.text(`Total Data : ${filteredLaporan.length}`, 14, 39);

        autoTable(doc, {
            startY: 44,
            head: [[
                "No", "Plat Nomor", "Jenis Kendaraan", "Nama Pemilik",
                "Jam Masuk", "Jam Keluar", "Durasi", "Biaya", "Status"
            ]],
            body: buildRows(),
            theme: "grid",
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
            styles: { fontSize: 8, cellPadding: 3 }
        });

        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 44;

        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(
            `Dicetak oleh Sistem Manajemen Parkir - ${tanggalLaporan}`,
            14,
            Math.min(finalY + 10, doc.internal.pageSize.getHeight() - 10)
        );

        doc.save("laporan-parkir.pdf");
        showToast("PDF berhasil diunduh");

    } catch (err) {

        console.error(err);
        showToast("Gagal membuat PDF", "error");

    } finally {

        exportingPdf = false;

    }

}

async function exportExcel() {

    if (filteredLaporan.length === 0) {
        showToast("Tidak ada data untuk diekspor", "error");
        return;
    }

    exportingExcel = true;

    try {

        const XLSX = await import("xlsx");

        const tanggalLaporan = new Date().toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

        const sheetData = [
            ["SISTEM MANAJEMEN PARKIR"],
            ["LAPORAN PARKIR"],
            [`Tanggal Laporan : ${tanggalLaporan}`],
            [`Periode Laporan : ${periodeText()}`],
            [`Total Data : ${filteredLaporan.length}`],
            [],
            [
                "No", "Plat Nomor", "Jenis Kendaraan", "Nama Pemilik",
                "Jam Masuk", "Jam Keluar", "Durasi", "Biaya", "Status"
            ],
            ...buildRows()
        ];

        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        ws["!cols"] = [
            { wch: 5 }, { wch: 14 }, { wch: 16 }, { wch: 20 },
            { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 12 }
        ];

        ws["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Parkir");

        XLSX.writeFile(wb, "laporan-parkir.xlsx");
        showToast("Excel berhasil diunduh");

    } catch (err) {

        console.error(err);
        showToast("Gagal membuat file Excel", "error");

    } finally {

        exportingExcel = false;

    }

}

function printLaporan() {

    if (filteredLaporan.length === 0) {
        showToast("Tidak ada data untuk diekspor", "error");
        return;
    }

    try {

        window.print();

    } catch (err) {

        console.error(err);
        showToast("Gagal mencetak laporan", "error");

    }

}

onMount(() => {
    loadLaporan();
});

</script>

<div class="page">

    <div class="page-header">
        <h1 class="text-3xl font-bold text-slate-800">Laporan parkir</h1>
        <p class="subtitle">Kelola dan lihat seluruh riwayat parkir kendaraan.</p>
    </div>

    <div class="filter-card">

        <div class="filter-title">
            <Filter size={16}/>
            <span>Filter Berdasarkan Tanggal</span>
        </div>

        <div class="filter-body">

            <div class="filter-field">
                <label for="tanggal-awal">Tanggal Awal</label>
                <input id="tanggal-awal" type="date" bind:value={filterStart}/>
            </div>

            <div class="filter-field">
                <label for="tanggal-akhir">Tanggal Akhir</label>
                <input id="tanggal-akhir" type="date" bind:value={filterEnd}/>
            </div>

            <div class="filter-actions">

                <button class="btn-filter" onclick={applyFilter}>
                    <Filter size={16}/>
                    Filter
                </button>

                <button class="btn-reset" onclick={resetFilter}>
                    <RotateCcw size={16}/>
                    Reset
                </button>

            </div>

        </div>

    </div>

    <div class="toolbar">

        <p class="total-data">
            Total Data : <b>{filteredLaporan.length}</b>
        </p>

        <div class="search-wrap">
            <Search size={17} class="search-icon"/>
            <input
                type="text"
                bind:value={search}
                placeholder="Cari plat nomor, pemilik, atau jenis..."
            />
        </div>

    </div>

    <div class="export-actions">

        <button class="btn-export pdf" onclick={exportPDF} disabled={exportingPdf}>
            <FileDown size={16}/>
            {exportingPdf ? "Exporting..." : "Export PDF"}
        </button>

        <button class="btn-export excel" onclick={exportExcel} disabled={exportingExcel}>
            <FileSpreadsheet size={16}/>
            {exportingExcel ? "Exporting..." : "Export Excel"}
        </button>

        <button class="btn-export print" onclick={printLaporan}>
            <Printer size={16}/>
            Print
        </button>

    </div>

    <div class="table-card">

        {#if loading}

            <!-- Skeleton Loading -->
            <div class="skeleton-wrap">
                {#each Array(6) as _, i}
                    <div class="skeleton-row" style="animation-delay:{i * 0.06}s">
                        <div class="skeleton-block w-sm"></div>
                        <div class="skeleton-block w-md"></div>
                        <div class="skeleton-block w-md"></div>
                        <div class="skeleton-block w-md"></div>
                        <div class="skeleton-block w-sm"></div>
                        <div class="skeleton-block w-sm"></div>
                        <div class="skeleton-block w-xs"></div>
                    </div>
                {/each}
            </div>

        {:else if filteredLaporan.length === 0}

            <!-- Empty State -->
            <div class="empty-state">
                <div class="empty-icon">
                    <Car size={48} strokeWidth={1.5}/>
                </div>
                <p>Belum ada laporan parkir.</p>
            </div>

        {:else}

            <div class="table-wrapper">

                <table>

                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Plat Nomor</th>
                            <th>Jenis Kendaraan</th>
                            <th>Nama Pemilik</th>
                            <th>Jam Masuk</th>
                            <th>Jam Keluar</th>
                            <th>Durasi</th>
                            <th>Biaya</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>

                    <tbody>

                        {#each paginatedLaporan as item, index (item.id)}

                            {@const badge = statusBadge(item.status)}

                            <tr class="row-anim" style="animation-delay:{index * 0.04}s">
                                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                <td class="plat">{item.plat_nomor}</td>
                                <td>{item.nama_jenis}</td>
                                <td>{item.nama_pemilik}</td>
                                <td>{formatWaktu(item.waktu_masuk)}</td>
                                <td>{formatWaktu(item.waktu_keluar)}</td>
                                <td>{formatDurasi(item.durasi_menit)}</td>
                                <td>{formatBiaya(item.biaya)}</td>
                                <td>
                                    <span class="badge {badge.cls}">
                                        {badge.label}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-detail" onclick={() => openDetail(item)}>
                                        <Eye size={15}/>
                                        Detail
                                    </button>
                                </td>
                            </tr>

                        {/each}

                    </tbody>

                </table>

            </div>

            <!-- Pagination -->
            <div class="pagination">

                <button
                    class="page-btn"
                    disabled={currentPage === 1}
                    onclick={() => currentPage = currentPage - 1}
                >
                    <ChevronLeft size={16}/>
                    Previous
                </button>

                {#each pageNumbers as page}
                    <button
                        class="page-btn number"
                        class:active={page === currentPage}
                        onclick={() => currentPage = page}
                    >
                        {page}
                    </button>
                {/each}

                <button
                    class="page-btn"
                    disabled={currentPage === totalPages}
                    onclick={() => currentPage = currentPage + 1}
                >
                    Next
                    <ChevronRight size={16}/>
                </button>

            </div>

        {/if}

    </div>

    <!-- Bagian ini hanya tampil saat print (lihat @media print), berisi
         judul, periode, total data, dan seluruh data hasil filter/search -->
    <div class="print-section">

        <div class="print-header">
            <h1>SISTEM MANAJEMEN PARKIR</h1>
            <h2>LAPORAN PARKIR</h2>
        </div>

        <div class="print-meta">
            <p><b>Periode Laporan:</b> {periodeText()}</p>
            <p><b>Total Data:</b> {filteredLaporan.length}</p>
        </div>

        <table class="print-table">
            <thead>
                <tr>
                    <th>No</th>
                    <th>Plat Nomor</th>
                    <th>Jenis Kendaraan</th>
                    <th>Nama Pemilik</th>
                    <th>Jam Masuk</th>
                    <th>Jam Keluar</th>
                    <th>Durasi</th>
                    <th>Biaya</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {#each filteredLaporan as item, index (item.id)}
                    {@const badge = statusBadge(item.status)}
                    <tr>
                        <td>{index + 1}</td>
                        <td>{item.plat_nomor}</td>
                        <td>{item.nama_jenis}</td>
                        <td>{item.nama_pemilik}</td>
                        <td>{formatWaktu(item.waktu_masuk)}</td>
                        <td>{formatWaktu(item.waktu_keluar)}</td>
                        <td>{formatDurasi(item.durasi_menit)}</td>
                        <td>{formatBiaya(item.biaya)}</td>
                        <td>{badge.label}</td>
                    </tr>
                {/each}
            </tbody>
        </table>

    </div>

    {#if toast.show}
        <div class="toast {toast.type}">
            {toast.message}
        </div>
    {/if}

</div>

{#if showDetailModal && selectedItem}

    {@const badge = statusBadge(selectedItem.status)}

    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal" onclick={closeDetail}>

        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="modal-content" onclick={(e) => e.stopPropagation()}>

            <div class="modal-header">
                <div class="modal-title">
                    <FileText size={20}/>
                    <h2>Detail Laporan</h2>
                </div>
                <button class="btn-close" onclick={closeDetail}>
                    <X size={18}/>
                </button>
            </div>

            <div class="detail-grid">

                <div class="detail-item">
                    <span class="detail-label">Plat Nomor</span>
                    <span class="detail-value">{selectedItem.plat_nomor}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Jenis Kendaraan</span>
                    <span class="detail-value">{selectedItem.nama_jenis}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Nama Pemilik</span>
                    <span class="detail-value">{selectedItem.nama_pemilik}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="badge {badge.cls}">{badge.label}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Jam Masuk</span>
                    <span class="detail-value">{formatWaktu(selectedItem.waktu_masuk)}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Jam Keluar</span>
                    <span class="detail-value">{formatWaktu(selectedItem.waktu_keluar)}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Durasi</span>
                    <span class="detail-value">{formatDurasi(selectedItem.durasi_menit)}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Biaya</span>
                    <span class="detail-value">{formatBiaya(selectedItem.biaya)}</span>
                </div>

            </div>

        </div>

    </div>

{/if}

<style>

.page{
    padding:35px;
    animation:pageFade .5s ease;
}

.page-header h1{
    margin-bottom:6px;
    font-size:36px;
    line-height:1.2;
    color:#0f172a;
}

.subtitle{
    color:#64748b;
    font-size:15px;
    margin-bottom:25px;
}

/* ===========================
   Filter Card
=========================== */

.filter-card{
    background:white;
    border-radius:16px;
    box-shadow:0 5px 15px rgba(0,0,0,.06);
    padding:22px 25px;
    margin-bottom:22px;
    animation:cardIn .5s ease both;
    transition:box-shadow .25s ease, transform .25s ease;
}

.filter-card:hover{
    box-shadow:0 10px 25px rgba(0,0,0,.09);
}

.filter-title{
    display:flex;
    align-items:center;
    gap:8px;
    font-weight:600;
    color:#2563eb;
    font-size:14px;
    margin-bottom:16px;
}

.filter-body{
    display:flex;
    align-items:flex-end;
    gap:18px;
    flex-wrap:wrap;
}

.filter-field{
    display:flex;
    flex-direction:column;
    gap:6px;
    min-width:180px;
}

.filter-field label{
    font-size:13px;
    color:#64748b;
    font-weight:600;
}

.filter-field input{
    padding:11px 14px;
    border:1px solid #dbe3ef;
    border-radius:10px;
    font-size:14px;
    outline:none;
    transition:border-color .2s, box-shadow .2s;
    color:#0f172a;
}

.filter-field input:focus{
    border-color:#2563eb;
    box-shadow:0 0 0 4px rgba(37,99,235,.15);
}

.filter-actions{
    display:flex;
    gap:10px;
}

.btn-filter, .btn-reset{
    display:inline-flex;
    align-items:center;
    gap:6px;
    padding:11px 18px;
    border:none;
    border-radius:10px;
    cursor:pointer;
    font-size:14px;
    font-weight:600;
    transition:transform .2s, background .2s, box-shadow .2s;
}

.btn-filter{
    background:#2563eb;
    color:white;
}

.btn-filter:hover{
    background:#1d4ed8;
    transform:translateY(-2px);
    box-shadow:0 8px 16px rgba(37,99,235,.25);
}

.btn-reset{
    background:#f1f5f9;
    color:#475569;
}

.btn-reset:hover{
    background:#e2e8f0;
    transform:translateY(-2px);
}

/* ===========================
   Toolbar (Total Data + Search)
=========================== */

.toolbar{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:16px;
    gap:20px;
    flex-wrap:wrap;
}

.total-data{
    font-size:20px;
    color:#0f172a;
}

.total-data b{
    color:#2563eb;
}

.search-wrap{
    position:relative;
    display:flex;
    align-items:center;
}

.search-wrap :global(.search-icon){
    position:absolute;
    left:14px;
    color:#94a3b8;
    pointer-events:none;
}

.search-wrap input{
    width:300px;
    padding:12px 15px 12px 40px;
    border:1px solid #dbe3ef;
    border-radius:10px;
    outline:none;
    font-size:14px;
    transition:border-color .2s, box-shadow .2s;
}

.search-wrap input:focus{
    border-color:#2563eb;
    box-shadow:0 0 0 4px rgba(37,99,235,.15);
}

/* ===========================
   Table Card
=========================== */

.table-card{
    background:white;
    border-radius:16px;
    box-shadow:0 5px 15px rgba(0,0,0,.08);
    overflow:hidden;
    animation:tableFade .5s ease .1s both;
}

.table-wrapper{
    overflow-x:auto;
    max-height:560px;
}

table{
    width:100%;
    border-collapse:collapse;
    min-width:920px;
}

thead th{
    position:sticky;
    top:0;
    z-index:2;
    background:linear-gradient(135deg, #2563eb, #1d4ed8);
    color:white;
    padding:15px;
    text-align:left;
    font-size:13px;
    letter-spacing:.3px;
    text-transform:uppercase;
}

td{
    padding:14px 15px;
    border-bottom:1px solid #eef1f6;
    font-size:14px;
    color:#334155;
    white-space:nowrap;
}

td.plat{
    font-weight:700;
    color:#0f172a;
}

.row-anim{
    opacity:0;
    animation:rowIn .4s ease forwards;
}

tbody tr:hover{
    background:#f8fafc;
    transition:background .2s;
}

/* ===========================
   Badge
=========================== */

.badge{
    display:inline-block;
    padding:5px 13px;
    border-radius:20px;
    font-weight:600;
    font-size:12px;
    color:white;
    transition:transform .2s;
}

.badge.selesai{
    background:#16a34a;
}

.badge.aktif{
    background:#eab308;
    animation:pulseBadge 1.6s ease infinite;
}

.badge.dibatalkan{
    background:#dc2626;
}

@keyframes pulseBadge{
    0%, 100%{
        box-shadow:0 0 0 0 rgba(234,179,8,.4);
    }
    50%{
        box-shadow:0 0 0 6px rgba(234,179,8,0);
    }
}

/* ===========================
   Aksi button
=========================== */

.btn-detail{
    display:inline-flex;
    align-items:center;
    gap:5px;
    padding:8px 14px;
    border:none;
    border-radius:8px;
    background:#eff6ff;
    color:#2563eb;
    font-size:13px;
    font-weight:600;
    cursor:pointer;
    transition:background .2s, transform .2s;
}

.btn-detail:hover{
    background:#2563eb;
    color:white;
    transform:translateY(-1px);
}

/* ===========================
   Export & Print buttons
=========================== */

.export-actions{
    display:flex;
    gap:10px;
    margin-bottom:16px;
    flex-wrap:wrap;
}

.btn-export{
    display:inline-flex;
    align-items:center;
    gap:6px;
    padding:11px 18px;
    border:none;
    border-radius:10px;
    cursor:pointer;
    font-size:14px;
    font-weight:600;
    color:white;
    transition:transform .2s, background .2s, box-shadow .2s, opacity .2s;
}

.btn-export:disabled{
    opacity:.6;
    cursor:not-allowed;
    transform:none;
    box-shadow:none;
}

.btn-export.pdf{
    background:#dc2626;
}

.btn-export.pdf:hover:not(:disabled){
    background:#b91c1c;
    transform:translateY(-2px);
    box-shadow:0 8px 16px rgba(220,38,38,.25);
}

.btn-export.excel{
    background:#16a34a;
}

.btn-export.excel:hover:not(:disabled){
    background:#15803d;
    transform:translateY(-2px);
    box-shadow:0 8px 16px rgba(22,163,74,.25);
}

.btn-export.print{
    background:#2563eb;
}

.btn-export.print:hover:not(:disabled){
    background:#1d4ed8;
    transform:translateY(-2px);
    box-shadow:0 8px 16px rgba(37,99,235,.25);
}

/* ===========================
   Toast
=========================== */

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

.toast.success{
    background:#16a34a;
}

.toast.error{
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

/* ===========================
   Print-only report section
=========================== */

.print-section{
    display:none;
}

@media print{

    :global(aside),
    :global(nav){
        display:none !important;
    }

    .page-header,
    .filter-card,
    .export-actions,
    .toolbar,
    .table-card,
    .toast{
        display:none !important;
    }

    .page{
        padding:0;
    }

    .print-section{
        display:block !important;
    }

    .print-header{
        text-align:center;
        margin-bottom:10px;
    }

    .print-header h1{
        font-size:18px;
        margin-bottom:2px;
        color:#000;
    }

    .print-header h2{
        font-size:14px;
        font-weight:600;
        color:#333;
    }

    .print-meta{
        margin:14px 0;
        font-size:12px;
        color:#000;
    }

    .print-meta p{
        margin-bottom:4px;
    }

    .print-table{
        width:100%;
        border-collapse:collapse;
        font-size:11px;
        color:#000;
    }

    .print-table th,
    .print-table td{
        border:1px solid #333;
        padding:6px 8px;
        text-align:left;
    }

    .print-table th{
        background:#eee !important;
        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;
    }

}

/* ===========================
   Skeleton Loading
=========================== */

.skeleton-wrap{
    padding:20px 25px;
    display:flex;
    flex-direction:column;
    gap:14px;
}

.skeleton-row{
    display:flex;
    gap:16px;
    align-items:center;
    opacity:0;
    animation:rowIn .4s ease forwards;
}

.skeleton-block{
    height:16px;
    border-radius:8px;
    background:linear-gradient(90deg, #eef1f6 25%, #e2e8f0 37%, #eef1f6 63%);
    background-size:400% 100%;
    animation:shimmer 1.4s ease infinite;
}

.w-xs{ width:60px; }
.w-sm{ width:90px; }
.w-md{ width:140px; }

@keyframes shimmer{
    0%{ background-position:100% 50%; }
    100%{ background-position:0 50%; }
}

/* ===========================
   Empty State
=========================== */

.empty-state{
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    padding:70px 20px;
    color:#94a3b8;
    animation:pageFade .5s ease;
}

.empty-icon{
    width:88px;
    height:88px;
    border-radius:50%;
    background:#eff6ff;
    color:#2563eb;
    display:flex;
    align-items:center;
    justify-content:center;
    margin-bottom:16px;
    animation:iconPop .5s ease;
}

.empty-state p{
    font-size:15px;
    font-weight:500;
}

/* ===========================
   Pagination
=========================== */

.pagination{
    display:flex;
    justify-content:center;
    align-items:center;
    gap:8px;
    padding:20px;
    flex-wrap:wrap;
}

.page-btn{
    display:inline-flex;
    align-items:center;
    gap:4px;
    padding:9px 14px;
    border:1px solid #dbe3ef;
    background:white;
    border-radius:8px;
    cursor:pointer;
    font-size:13px;
    font-weight:600;
    color:#475569;
    transition:all .2s ease;
}

.page-btn:hover:not(:disabled){
    border-color:#2563eb;
    color:#2563eb;
    transform:translateY(-1px);
}

.page-btn:disabled{
    opacity:.4;
    cursor:not-allowed;
}

.page-btn.number{
    min-width:38px;
    justify-content:center;
    padding:9px 12px;
}

.page-btn.number.active{
    background:#2563eb;
    border-color:#2563eb;
    color:white;
}

/* ===========================
   Modal Detail
=========================== */

.modal{
    position:fixed;
    inset:0;
    background:rgba(15,23,42,.5);
    display:flex;
    justify-content:center;
    align-items:center;
    z-index:999;
    animation:fadeIn .2s ease;
}

.modal-content{
    width:460px;
    max-width:92vw;
    background:white;
    border-radius:16px;
    padding:26px;
    animation:popup .25s ease;
    box-shadow:0 20px 45px rgba(0,0,0,.25);
}

.modal-header{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:20px;
    padding-bottom:16px;
    border-bottom:1px solid #eef1f6;
}

.modal-title{
    display:flex;
    align-items:center;
    gap:8px;
    color:#2563eb;
}

.modal-title h2{
    font-size:18px;
    color:#0f172a;
}

.btn-close{
    background:#f1f5f9;
    border:none;
    width:32px;
    height:32px;
    border-radius:8px;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    color:#64748b;
    transition:background .2s;
}

.btn-close:hover{
    background:#e2e8f0;
}

.detail-grid{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:16px;
}

.detail-item{
    display:flex;
    flex-direction:column;
    gap:4px;
}

.detail-label{
    font-size:12px;
    color:#94a3b8;
    font-weight:600;
    text-transform:uppercase;
    letter-spacing:.3px;
}

.detail-value{
    font-size:14px;
    color:#0f172a;
    font-weight:600;
}

/* ===========================
   Animations (shared)
=========================== */

@keyframes pageFade{
    from{ opacity:0; transform:translateY(10px); }
    to{ opacity:1; transform:translateY(0); }
}

@keyframes cardIn{
    from{ opacity:0; transform:translateY(14px); }
    to{ opacity:1; transform:translateY(0); }
}

@keyframes tableFade{
    from{ opacity:0; transform:translateY(15px); }
    to{ opacity:1; transform:translateY(0); }
}

@keyframes rowIn{
    from{ opacity:0; transform:translateX(-15px); }
    to{ opacity:1; transform:translateX(0); }
}

@keyframes iconPop{
    from{ opacity:0; transform:scale(.6); }
    to{ opacity:1; transform:scale(1); }
}

@keyframes fadeIn{
    from{ opacity:0; }
    to{ opacity:1; }
}

@keyframes popup{
    from{ opacity:0; transform:scale(.85); }
    to{ opacity:1; transform:scale(1); }
}

/* ===========================
   Responsive
=========================== */

@media (max-width: 1024px){

    .filter-body{
        gap:14px;
    }

    .filter-field{
        min-width:150px;
    }

}

@media (max-width: 768px){

    .page{
        padding:20px;
    }

    .page-header h1{
        font-size:28px;
    }

    .filter-body{
        flex-direction:column;
        align-items:stretch;
    }

    .filter-actions{
        justify-content:flex-end;
    }

    .toolbar{
        flex-direction:column;
        align-items:stretch;
    }

    .search-wrap input{
        width:100%;
    }

    .detail-grid{
        grid-template-columns:1fr;
    }

}

@media (max-width: 480px){

    .filter-actions{
        flex-direction:column;
    }

    .btn-filter, .btn-reset{
        justify-content:center;
        width:100%;
    }

    .export-actions{
        flex-direction:column;
    }

    .btn-export{
        justify-content:center;
        width:100%;
    }

    .pagination{
        gap:6px;
    }

    .page-btn{
        padding:8px 10px;
        font-size:12px;
    }

}

</style>

<script>

import { onMount } from "svelte";
import { apiFetch } from "../../../services/api.js";

import Trash2 from "lucide-svelte/icons/trash-2";

let logs = $state([]);
let search = $state("");
let loading = $state(true);
let errorMessage = $state("");

// Pencarian & pagination dilakukan di server, sama seperti halaman Parkir.
let currentPage = $state(1);
let totalPages = $state(1);
let totalData = $state(0);
const pageLimit = 20;

let searchTimer;

// Modal "Bersihkan Audit Log"
let showCleanModal = $state(false);
let hapusHari = $state("90");
let countHapus = $state(null);
let countLoading = $state(false);
let countError = $state("");
let menghapus = $state(false);
let countSeq = 0;

let toast = $state({
    show: false,
    message: "",
    type: "success"
});

const LABEL_AKSI = {
    KENDARAAN_MASUK: { teks: "Kendaraan Masuk", kelas: "aksi-masuk" },
    KENDARAAN_KELUAR: { teks: "Kendaraan Keluar", kelas: "aksi-keluar" },
    HAPUS_PARKIR: { teks: "Hapus Data Parkir", kelas: "aksi-hapus" },
    HAPUS_AUDIT_LOG: { teks: "Bersihkan Audit Log", kelas: "aksi-hapus" }
};

const LABEL_FIELD = {
    kode_tiket: "Tiket",
    plat_nomor: "Plat",
    kendaraan_id: "ID Kendaraan",
    jenis: "Jenis",
    durasi: "Durasi",
    biaya: "Biaya",
    metode_bayar: "Metode",
    status: "Status",
    older_than_days: "Lebih lama dari (hari)",
    jumlah_dihapus: "Jumlah dihapus"
};

async function loadLogs(page = currentPage) {

    loading = true;
    errorMessage = "";

    try {

        const params = new URLSearchParams({
            page: String(page),
            limit: String(pageLimit)
        });

        if (search.trim()) params.set("q", search.trim());

        const response = await apiFetch(`/admin/audit-log?${params.toString()}`);

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            errorMessage = data.message || "Gagal mengambil audit log";
            logs = [];
            return;
        }

        logs = data.data;
        currentPage = data.page;
        totalPages = data.totalPages;
        totalData = data.total;

    } catch (err) {

        console.error(err);
        errorMessage = "Terjadi kesalahan saat mengambil audit log";

    } finally {

        loading = false;

    }

}

function handleSearchInput() {

    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
        currentPage = 1;
        loadLogs(1);
    }, 350);

}

function gantiHalaman(page) {

    if (page < 1 || page > totalPages) return;

    loadLogs(page);

}

function formatWaktu(value) {

    if (!value) return "-";

    const d = new Date(value);

    if (isNaN(d.getTime())) return String(value);

    return d.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

}

// detail disimpan backend sebagai JSON string; tampilkan sebagai
// pasangan "Label: nilai" yang mudah dibaca.
function ringkasDetail(detail) {

    if (!detail) return "-";

    try {

        const obj = JSON.parse(detail);

        if (!obj || typeof obj !== "object") return String(detail);

        return Object.entries(obj)
            .filter(([, v]) => v !== null && v !== undefined && v !== "")
            .map(([k, v]) => {
                const nilai = k === "biaya"
                    ? "Rp" + Number(v).toLocaleString("id-ID")
                    : v;
                return `${LABEL_FIELD[k] || k}: ${nilai}`;
            })
            .join(" \u00b7 ");

    } catch {

        return String(detail);

    }

}

function showToast(message, type = "success") {

    toast.show = true;
    toast.message = message;
    toast.type = type;

    setTimeout(() => {
        toast.show = false;
    }, 3000);

}

// ===========================
// Bersihkan audit log lama
// ===========================
async function hitungYangAkanDihapus() {

    const seq = ++countSeq;

    countLoading = true;
    countError = "";
    countHapus = null;

    try {

        const response = await apiFetch(`/admin/audit-log/count?older_than_days=${hapusHari}`);

        if (!response || seq !== countSeq) return;

        const data = await response.json();

        if (seq !== countSeq) return;

        if (!response.ok) {
            countError = data.message || "Gagal menghitung catatan";
            return;
        }

        countHapus = data.count;

    } catch (err) {

        if (seq === countSeq) countError = "Gagal menghitung catatan";

    } finally {

        if (seq === countSeq) countLoading = false;

    }

}

function bukaBersihkan() {

    showCleanModal = true;
    hitungYangAkanDihapus();

}

function tutupBersihkan() {

    if (menghapus) return;

    showCleanModal = false;
    countSeq++;

}

async function hapusLogLama() {

    menghapus = true;

    try {

        const response = await apiFetch(`/admin/audit-log?older_than_days=${hapusHari}`, {
            method: "DELETE"
        });

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message || "Gagal menghapus audit log", "error");
            return;
        }

        showToast(data.message);
        showCleanModal = false;
        currentPage = 1;
        await loadLogs(1);

    } catch (err) {

        console.error(err);
        showToast("Terjadi kesalahan saat menghapus audit log", "error");

    } finally {

        menghapus = false;

    }

}

function handleKeydown(e) {

    if (e.key === "Escape" && showCleanModal) tutupBersihkan();

}

onMount(() => {
    loadLogs(1);
});

</script>

<svelte:window onkeydown={handleKeydown} />

<div class="page">

    <h1 class="text-3xl font-bold text-slate-800">Audit Log</h1>

    <p class="total-data">
        Total Data : <b>{totalData}</b>
    </p>

    <div class="toolbar">

        <input
            type="text"
            bind:value={search}
            oninput={handleSearchInput}
            placeholder="🔍 Cari aksi / email / detail..."
        />

        <button class="clean-btn" onclick={bukaBersihkan}>
            <Trash2 size={16}/>
            Bersihkan Log
        </button>

    </div>

    {#if loading}

        <div class="loading">
            Memuat data...
        </div>

    {:else if errorMessage}

        <div class="empty error-text">
            {errorMessage}
        </div>

    {:else}

    <table>

        <thead>
            <tr>
                <th>No</th>
                <th>Waktu</th>
                <th>Pelaku</th>
                <th>Aksi</th>
                <th>Detail</th>
            </tr>
        </thead>

        <tbody>

        {#if logs.length === 0}

        <tr>
            <td colspan="5" class="empty">
                Belum ada catatan audit
            </td>
        </tr>

        {:else}

        {#each logs as log, index}

        <tr class="row-anim" style="animation-delay:{index * 0.03}s">
            <td>{(currentPage - 1) * pageLimit + index + 1}</td>
            <td class="nowrap">{formatWaktu(log.created_at)}</td>
            <td>
                <div class="pelaku-nama">{log.user_nama || "(akun dihapus)"}</div>
                <div class="pelaku-email">{log.user_email || "-"}</div>
            </td>
            <td class="nowrap">
                <span class="badge {LABEL_AKSI[log.aksi]?.kelas || 'aksi-lain'}">
                    {LABEL_AKSI[log.aksi]?.teks || log.aksi}
                </span>
            </td>
            <td class="detail-cell">{ringkasDetail(log.detail)}</td>
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

    {/if}

    {#if showCleanModal}

    <div class="modal">

        <div class="delete-card">

            <div class="icon">🧹</div>

            <h2>Bersihkan Audit Log?</h2>

            <p>Hapus semua catatan yang lebih lama dari:</p>

            <select
                bind:value={hapusHari}
                onchange={(e) => {
                    hapusHari = e.currentTarget.value;
                    hitungYangAkanDihapus();
                }}
                disabled={menghapus}
            >
                <option value="7">7 hari</option>
                <option value="30">30 hari</option>
                <option value="90">90 hari</option>
                <option value="180">180 hari</option>
                <option value="365">1 tahun</option>
            </select>

            <div class="count-info">
                {#if countLoading}
                    Menghitung catatan...
                {:else if countError}
                    <span class="error-text">{countError}</span>
                {:else if countHapus === 0}
                    Tidak ada catatan yang lebih lama dari periode ini.
                {:else if countHapus !== null}
                    Akan menghapus <b>{countHapus}</b> catatan.
                {/if}
            </div>

            <p class="warn">
                Tindakan ini tidak bisa dibatalkan. Pembersihan akan dicatat
                sebagai satu baris baru di audit log.
            </p>

            <div class="action">

                <button class="cancel" onclick={tutupBersihkan} disabled={menghapus}>
                    Batal
                </button>

                <button
                    class="danger"
                    onclick={hapusLogLama}
                    disabled={menghapus || countLoading || !countHapus}
                >
                    {menghapus ? "Menghapus..." : "Ya, Hapus"}
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

button:hover:not(:disabled){
    background:#1d4ed8;
    transform:translateY(-2px);
    box-shadow:0 8px 16px rgba(37,99,235,.25);
}

button:active:not(:disabled){
    transform:translateY(0) scale(.97);
}

button:disabled{
    opacity:.5;
    cursor:not-allowed;
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
    from{ opacity:0; transform:translateX(-15px); }
    to{ opacity:1; transform:translateX(0); }
}

@keyframes tableFade{
    from{ opacity:0; transform:translateY(15px); }
    to{ opacity:1; transform:translateY(0); }
}

@keyframes pageFade{
    from{ opacity:0; transform:translateY(10px); }
    to{ opacity:1; transform:translateY(0); }
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
    vertical-align:top;
}

tr:hover{
    background:#f8fafc;
    transition:background .2s;
}

.nowrap{
    white-space:nowrap;
}

.pelaku-nama{
    font-weight:600;
    color:#0f172a;
}

.pelaku-email{
    font-size:12px;
    color:#64748b;
}

.detail-cell{
    color:#475569;
    line-height:1.5;
}

.badge{
    padding:5px 12px;
    border-radius:20px;
    font-weight:600;
    font-size:13px;
    color:white;
}

.aksi-masuk{
    background:#2563eb;
}

.aksi-keluar{
    background:#16a34a;
}

.aksi-hapus{
    background:#dc2626;
}

.aksi-lain{
    background:#64748b;
}

.clean-btn{
    background:#dc2626;
}

.clean-btn:hover:not(:disabled){
    background:#b91c1c;
    box-shadow:0 8px 16px rgba(220,38,38,.25);
}

.modal{
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.45);
    display:flex;
    justify-content:center;
    align-items:center;
    z-index:1000;
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

.delete-card select{
    width:100%;
    margin-top:12px;
    padding:12px 15px;
    border:1px solid #dbe3ef;
    border-radius:10px;
    outline:none;
    font-size:15px;
    background:white;
}

.delete-card select:focus{
    border-color:#2563eb;
    box-shadow:0 0 0 4px rgba(37,99,235,.15);
}

.count-info{
    margin:14px 0 6px;
    padding:10px 12px;
    border-radius:10px;
    background:#f1f5f9;
    color:#334155;
    font-size:14px;
    min-height:20px;
}

.delete-card p.warn{
    font-size:13px;
    margin-top:8px;
}

@keyframes popup{
    from{ opacity:0; transform:scale(.8); }
    to{ opacity:1; transform:scale(1); }
}

.action{
    display:flex;
    justify-content:center;
    gap:10px;
    margin-top:20px;
}

.cancel{
    background:#64748b;
}

.danger{
    background:#dc2626;
}

.danger:hover:not(:disabled){
    background:#b91c1c;
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
    from{ opacity:0; transform:translateX(80px); }
    to{ opacity:1; transform:translateX(0); }
}

.toolbar{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:20px;
    gap:20px;
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
    transform:none;
    box-shadow:none;
}

.page-info{
    font-size:14px;
    color:#64748b;
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

.error-text{
    color:#dc2626;
}

.loading{
    text-align:center;
    padding:60px;
    color:#64748b;
}

</style>

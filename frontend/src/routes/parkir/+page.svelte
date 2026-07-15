<script>

import { onMount } from "svelte";
import { goto } from "$app/navigation";
import BASE_URL from "../../services/api.js";
import { logout } from "../../stores/auth.js";

import { Plus, LogOut, Trash2 } from "lucide-svelte";

let parkir = $state([]);
let kendaraanList = $state([]);
let search = $state("");

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

let showModal = $state(false);
let kendaraanId = $state("");
let waktuMasuk = $state(toDatetimeLocal(new Date()));

let showKeluarModal = $state(false);
let keluarId = $state(null);
let keluarPlat = $state("");
let waktuKeluar = $state(toDatetimeLocal(new Date()));
let biaya = $state(0);

let showDeleteModal = $state(false);
let deleteId = $state(null);
let deletePlat = $state("");

let toast = $state({
    show: false,
    message: "",
    type: "success"
});
let loading = $state(true);

function handleUnauthorized() {
    logout();
    showToast("Sesi berakhir, silakan login kembali", "error");
    goto("/");
}

async function loadParkir() {

    loading = true;

    try {

        const token = localStorage.getItem("token");

        if (!token) {
            handleUnauthorized();
            return;
        }

        const response = await fetch(`${BASE_URL}/parkir`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        const data = await response.json();

        parkir = [...data];

    } catch (err) {

        console.error(err);
        showToast("Gagal mengambil data", "error");

    } finally {

        loading = false;

    }

}

async function loadKendaraanList() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(`${BASE_URL}/kendaraan`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        const data = await response.json();

        kendaraanList = [...data];

    } catch (err) {

        console.error(err);

    }

}

async function tambahParkir() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(`${BASE_URL}/parkir`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },

            body: JSON.stringify({
                kendaraan_id: kendaraanId,
                waktu_masuk: waktuMasuk.replace("T", " ") + ":00"
            })

        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

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

    } catch (err) {

        console.error(err);
        showToast("Terjadi kesalahan", "error");

    }

}

function bukaKeluar(item) {

    keluarId = item.id;
    keluarPlat = item.plat_nomor;
    waktuKeluar = toDatetimeLocal(new Date());
    biaya = 0;
    showKeluarModal = true;

}

async function catatKeluar() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(

            `${BASE_URL}/parkir/${keluarId}`,

            {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify({
                    waktu_keluar: waktuKeluar.replace("T", " ") + ":00",
                    status: "Keluar",
                    biaya: biaya
                })

            }

        );

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        const data = await response.json();

        if (!response.ok) {

            showToast(data.message, "error");
            return;

        }

        showKeluarModal = false;
        keluarId = null;
        keluarPlat = "";

        showToast("Kendaraan berhasil dicatat keluar");

        loadParkir();

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

        const token = localStorage.getItem("token");

        const response = await fetch(
            `${BASE_URL}/parkir/${deleteId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

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
    if (!value) return "-";
    return "Rp " + Number(value).toLocaleString("id-ID");
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
    loadKendaraanList();
    loadParkir();
});

</script>

<div class="page">

    <h1>Parkir</h1>

            <p class="total-data">
                Total Data :
                <b>{filteredParkir.length}</b>
            </p>

            <div class="toolbar">

                <input
                    type="text"
                    bind:value={search}
                    placeholder="🔍 Cari plat nomor / pemilik..."
                />

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
                        <th>Aksi</th>
                    </tr>
                </thead>

                <tbody>

                {#if filteredParkir.length === 0}

                <tr>
                    <td colspan="9" class="empty">
                        Data tidak ditemukan
                    </td>
                </tr>

                {:else}

                {#each filteredParkir as item, index}

                <tr class="row-anim" style="animation-delay:{index * 0.05}s">
                    <td>{index + 1}</td>
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

                        {#if item.status === "Parkir"}
                            <button class="keluar" onclick={() => bukaKeluar(item)}>
                                <LogOut size={16}/>
                                Keluar
                            </button>
                        {/if}

                        <button class="delete" onclick={() => bukaDelete(item)}>
                            <Trash2 size={16}/>
                            Delete
                        </button>

                    </td>
                </tr>

                {/each}

                {/if}

                </tbody>

            </table>

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
                        {#each kendaraanList as item}
                            <option value={item.id}>{item.plat_nomor} - {item.nama_pemilik}</option>
                        {/each}
                    </select>

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

            {#if showKeluarModal}

            <div class="modal">

                <div class="modal-content">

                    <h2>Catat Kendaraan Keluar</h2>

                    <p class="sub">Plat Nomor: <b>{keluarPlat}</b></p>

                    <input
                        type="datetime-local"
                        bind:value={waktuKeluar}
                    />

                    <input
                        type="number"
                        min="0"
                        bind:value={biaya}
                        placeholder="Biaya parkir (Rp)"
                    />

                    <div class="action">

                        <button class="cancel" onclick={() => showKeluarModal = false}>
                            Batal
                        </button>

                        <button class="save" onclick={catatKeluar}>
                            Simpan
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

.modal-content .sub{
    margin-top:15px;
    color:#64748b;
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

.action{
    display:flex;
    justify-content:flex-end;
    gap:10px;
    margin-top:20px;
}

.cancel{
    background:#64748b;
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

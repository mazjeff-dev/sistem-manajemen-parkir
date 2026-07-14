<script>

import { onMount } from "svelte";
import { goto } from "$app/navigation";
import BASE_URL from "../../services/api.js";
import { logout } from "../../stores/auth.js";
import Sidebar from "../../lib/Sidebar.svelte";
import Navbar from "../../lib/Navbar.svelte";

import { Plus, Pencil, Trash2 } from "lucide-svelte";

let kendaraan = $state([]);
let jenisList = $state([]);
let search = $state("");

let filteredKendaraan = $derived(
    kendaraan.filter((item) =>
        item.plat_nomor.toLowerCase().includes(search.toLowerCase()) ||
        item.nama_pemilik.toLowerCase().includes(search.toLowerCase())
    )
);

let showModal = $state(false);
let platNomor = $state("");
let namaPemilik = $state("");
let warna = $state("");
let jenisId = $state("");
let editMode = $state(false);
let selectedId = $state(null);

let showDeleteModal = $state(false);
let deleteId = $state(null);
let deleteNama = $state("");

let toast = $state({
    show: false,
    message: "",
    type: "success"
});
let loading = $state(false);

function handleUnauthorized() {
    logout();
    showToast("Sesi berakhir, silakan login kembali", "error");
    goto("/");
}

async function loadKendaraan() {

    loading = true;

    try {

        const token = localStorage.getItem("token");

        if (!token) {
            handleUnauthorized();
            return;
        }

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

        kendaraan = [...data];

    } catch (err) {

        console.error(err);
        showToast("Gagal mengambil data", "error");

    } finally {

        loading = false;

    }

}

async function loadJenisList() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(`${BASE_URL}/jenis`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        const data = await response.json();

        jenisList = [...data];

    } catch (err) {

        console.error(err);

    }

}

async function tambahKendaraan() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(`${BASE_URL}/kendaraan`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },

            body: JSON.stringify({
                plat_nomor: platNomor,
                nama_pemilik: namaPemilik,
                warna: warna,
                jenis_id: jenisId
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

        resetForm();

        showModal = false;

        showToast(data.message);

        await loadKendaraan();

    } catch (err) {

        console.error(err);
        showToast("Terjadi kesalahan", "error");

    }

}

function bukaEdit(item) {

    editMode = true;
    showModal = true;
    selectedId = item.id;
    platNomor = item.plat_nomor;
    namaPemilik = item.nama_pemilik;
    warna = item.warna;

    const jenisTerkait = jenisList.find(
        (j) => j.nama_jenis === item.nama_jenis
    );

    jenisId = jenisTerkait ? jenisTerkait.id : "";

}

async function updateKendaraan() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(

            `${BASE_URL}/kendaraan/${selectedId}`,

            {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify({
                    plat_nomor: platNomor,
                    nama_pemilik: namaPemilik,
                    warna: warna,
                    jenis_id: jenisId
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

        resetForm();

        showModal = false;
        editMode = false;

        showToast("Kendaraan berhasil diperbarui");

        loadKendaraan();

    } catch (err) {

        console.error(err);
        showToast("Terjadi kesalahan", "error");

    }

}

function bukaDelete(item) {

    deleteId = item.id;
    deleteNama = item.plat_nomor;
    showDeleteModal = true;

}

async function deleteKendaraan() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(
            `${BASE_URL}/kendaraan/${deleteId}`,
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
        deleteNama = "";

        showToast("Kendaraan berhasil dihapus");

        loadKendaraan();

    } catch (err) {

        console.error(err);
        showToast("Terjadi kesalahan", "error");

    }

}

function resetForm() {
    platNomor = "";
    namaPemilik = "";
    warna = "";
    jenisId = "";
    selectedId = null;
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
    loadJenisList();
    loadKendaraan();
});

</script>

<div class="container">

    <Sidebar/>

    <div class="content">

        <Navbar/>

        <div class="page">

            <h1>Kendaraan</h1>

            <p class="total-data">
                Total Data :
                <b>{filteredKendaraan.length}</b>
            </p>

            <div class="toolbar">

                <input
                    type="text"
                    bind:value={search}
                    placeholder="🔍 Cari plat nomor / pemilik..."
                />

                <button onclick={() => { resetForm(); editMode = false; showModal = true; }}>
                    <Plus size={16}/>
                    Tambah Kendaraan
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
                        <th>Nama Pemilik</th>
                        <th>Warna</th>
                        <th>Jenis</th>
                        <th>Aksi</th>
                    </tr>
                </thead>

                <tbody>

                {#if filteredKendaraan.length === 0}

                <tr>
                    <td colspan="6" class="empty">
                        Data tidak ditemukan
                    </td>
                </tr>

                {:else}

                {#each filteredKendaraan as item, index}

                <tr class="row-anim" style="animation-delay:{index * 0.05}s">
                    <td>{index + 1}</td>
                    <td>{item.plat_nomor}</td>
                    <td>{item.nama_pemilik}</td>
                    <td>{item.warna}</td>
                    <td>{item.nama_jenis}</td>
                    <td>

                        <button class="edit" onclick={() => bukaEdit(item)}>
                            <Pencil size={16}/>
                            Edit
                        </button>

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
                        Apakah Anda yakin ingin menghapus kendaraan
                        <b>{deleteNama}</b>?
                    </p>

                    <div class="action">

                        <button class="cancel" onclick={() => {
                            showDeleteModal = false;
                            deleteId = null;
                            deleteNama = "";
                        }}>
                            Batal
                        </button>

                        <button class="danger" onclick={deleteKendaraan}>
                            Ya, Hapus
                        </button>

                    </div>

                </div>

            </div>

            {/if}

            {#if showModal}

            <div class="modal">

                <div class="modal-content">

                    <h2>
                        {editMode ? "Edit Kendaraan" : "Tambah Kendaraan"}
                    </h2>

                    <input
                        type="text"
                        bind:value={platNomor}
                        placeholder="Plat nomor"
                    />

                    <input
                        type="text"
                        bind:value={namaPemilik}
                        placeholder="Nama pemilik"
                    />

                    <input
                        type="text"
                        bind:value={warna}
                        placeholder="Warna kendaraan"
                    />

                    <select bind:value={jenisId}>
                        <option value="" disabled>Pilih jenis kendaraan</option>
                        {#each jenisList as item}
                            <option value={item.id}>{item.nama_jenis}</option>
                        {/each}
                    </select>

                    <div class="action">

                        <button class="cancel" onclick={() => {
                            showModal = false;
                            editMode = false;
                            resetForm();
                        }}>
                            Batal
                        </button>

                        <button class="save" onclick={editMode ? updateKendaraan : tambahKendaraan}>
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

    </div>

</div>

<style>

.container{
    display:flex;
    min-height:100vh;
    background:#eef2f7;
}

.content{
    flex:1;
}

.page{
    padding:35px;
    animation:pageFade .5s ease;
}

.page h1{
    margin-bottom:20px;
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
}

td{
    padding:15px;
    border-bottom:1px solid #eee;
}

tr:hover{
    background:#f8fafc;
    transition:background .2s;
}

.edit{
    background:#16a34a;
    color:white;
    margin-right:8px;
}

.delete{
    background:#dc2626;
    color:white;
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

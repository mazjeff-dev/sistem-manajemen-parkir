<script>

import { onMount } from "svelte";
import { goto } from "$app/navigation";
import BASE_URL from "../../services/api.js";
import { logout } from "../../stores/auth.js";

import { Plus, Pencil, Trash2, Search } from "lucide-svelte";


let jenis = $state([]);
let search = $state("");

let filteredJenis = $derived(
    jenis.filter((item) =>
        item.nama_jenis
            .toLowerCase()
            .includes(search.toLowerCase())
    )
);
let showModal = $state(false);
let namaJenis = $state("");
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
let loading = $state(true);

function handleUnauthorized() {
    logout();
    showToast("Sesi berakhir, silakan login kembali", "error");
    goto("/");
}

async function loadJenis() {

    loading = true;

    try {

        const token = localStorage.getItem("token");

        if (!token) {
            handleUnauthorized();
            return;
        }

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

        jenis = [...data];

    } catch (err) {

        console.error(err);
        showToast("Gagal mengambil data", "error");

    } finally {

        loading = false;

    }

}

async function tambahJenis() {

    try {

        const token = localStorage.getItem("token");

        console.log("Token:", token);

        console.log("Body:", {
            nama_jenis: namaJenis
        });

        const response = await fetch(`${BASE_URL}/jenis`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                nama_jenis: namaJenis
            })

        });

        console.log("Status:", response.status);

        const data = await response.json();

        console.log("Response:", data);

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {

            showToast(data.message, "error");
            return;

        }

        namaJenis = "";

        showModal = false;

        showToast(data.message);

        await loadJenis();

    } catch (err) {

        console.error(err);

        showToast("Terjadi kesalahan", "error");

    }

}

function bukaEdit(item) {

    editMode = true;

    showModal = true;

    selectedId = item.id;

    namaJenis = item.nama_jenis;

}

async function updateJenis() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(

            `${BASE_URL}/jenis/${selectedId}`,

            {

                method: "PUT",

                headers:{

                    "Content-Type":"application/json",

                    Authorization:`Bearer ${token}`

                },

                body:JSON.stringify({

                    nama_jenis:namaJenis

                })

            }

        );

        const data = await response.json();

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if(!response.ok){

            showToast(data.message, "error");

            return;

        }

        showModal = false;

        editMode = false;

        namaJenis = "";

        selectedId = null;

        showToast("Jenis kendaraan berhasil diperbarui");

        loadJenis();

    }catch(err){

        console.error(err);

        showToast("Terjadi kesalahan","error");


    }

}

function bukaDelete(item) {

    deleteId = item.id;

    deleteNama = item.nama_jenis;

    showDeleteModal = true;

}

async function deleteJenis() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(
            `${BASE_URL}/jenis/${deleteId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {

            showToast(data.message, "error");
            return;

        }

        showDeleteModal = false;

        deleteId = null;

        deleteNama = "";

        showToast("Jenis kendaraan berhasil dihapus");

        loadJenis();

    } catch (err) {

       console.error(err);

        showToast("Terjadi kesalahan","error");
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

onMount(() => {
    loadJenis();
});


</script>

<div class="page">

    <h1>Jenis Kendaraan</h1>

            <p class="total-data">

                Total Data :
                <b>{filteredJenis.length}</b>

            </p>

            <div class="toolbar">

                <input
                    type="text"
                    bind:value={search}
                    placeholder="🔍 Cari jenis kendaraan..."
                />

                <button onclick={() => showModal = true}>
                    + Tambah Jenis
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

                        <th>Nama Jenis</th>

                        <th>Aksi</th>

                        </tr>

                </thead>

                <tbody>

                {#if filteredJenis.length === 0}

                <tr>

                    <td colspan="3" class="empty">

                        Data tidak ditemukan

                    </td>

                </tr>

                {:else}

                {#each filteredJenis as item,index}

                <tr class="row-anim" style="animation-delay:{index * 0.05}s">

                    <td>{index + 1}</td>

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

                    <div class="icon">

                        🗑️

                    </div>

                    <h2>Hapus Data?</h2>

                    <p>

                        Apakah Anda yakin ingin menghapus

                        <b>{deleteNama}</b>?

                    </p>

                    <div class="action">

                        <button
                            class="cancel"
                            onclick={() => {
                            

                                showDeleteModal = false;

                                deleteId = null;

                                deleteNama = "";

                            }}
                        >
                            Batal
                        </button>

                        <button
                            class="danger"
                            onclick={deleteJenis}
                        >
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
                        {editMode

                        ? "Edit Jenis Kendaraan"

                        : "Tambah Jenis Kendaraan"}

                    </h2>

                    <input
                    type="text"
                    bind:value={namaJenis}
                    placeholder="Nama jenis kendaraan"
                    >

                    <div class="action">

                        <button
                            class="cancel"
                            onclick={() => {
                                showModal = false;
                                editMode = false;
                                selectedId = null;
                                namaJenis = "";

                            }}
                        >
                            Batal
                        </button>

                        <button
                            class="save"
                            onclick={editMode ? updateJenis : tambahJenis}
                        >
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

    width:400px;

    background:white;

    border-radius:16px;

    padding:25px;

    animation:popup .25s;

}

.modal-content input{

    width:100%;

    margin-top:20px;

    padding:12px;

    border:1px solid #ddd;

    border-radius:10px;

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

    margin-bottom:20px;

}

.empty{

    text-align:center;

    padding:40px;

    color:#94a3b8;

}

.loading{

display:flex;

justify-content:center;

align-items:center;

padding:40px;

font-weight:bold;

color:#2563eb;

}

</style>
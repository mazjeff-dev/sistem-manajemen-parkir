<script>

import { onMount } from "svelte";
import { apiFetch } from "../../services/api.js";
import { role } from "../../stores/auth.js";

import Plus from "lucide-svelte/icons/plus";
import Pencil from "lucide-svelte/icons/pencil";
import Trash2 from "lucide-svelte/icons/trash-2";
import Search from "lucide-svelte/icons/search";


let jenis = $state([]);
let search = $state("");

// Hanya admin yang boleh menambah/mengubah/menghapus jenis kendaraan
// (kapasitas & tarif). Backend juga sudah memproteksi endpoint ini,
// tapi UI disesuaikan juga supaya petugas tidak melihat tombol yang
// pasti akan ditolak server.
let isAdmin = $derived($role === "admin");

let filteredJenis = $derived(
    jenis.filter((item) =>
        item.nama_jenis
            .toLowerCase()
            .includes(search.toLowerCase())
    )
);
let showModal = $state(false);
let namaJenis = $state("");
let tarif = $state("");
let kapasitas = $state("");
let modeTarif = $state("flat");
let tarifPerJam = $state("");
let gratisMenit = $state("");
let tarifJamPertama = $state("");
let tarifMaksHarian = $state("");
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

function formatRupiah(angka) {
    const nilai = Number(angka) || 0;
    return "Rp " + nilai.toLocaleString("id-ID");
}

async function loadJenis() {

    loading = true;

    try {

        const response = await apiFetch("/jenis");

        if (!response) return;

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

        const response = await apiFetch("/jenis", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                nama_jenis: namaJenis,
                tarif: tarif,
                kapasitas: kapasitas,
                mode_tarif: modeTarif,
                tarif_per_jam: tarifPerJam,
                gratis_menit: gratisMenit,
                tarif_jam_pertama: tarifJamPertama,
                tarif_maks_harian: tarifMaksHarian
            })

        });

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {

            showToast(data.message, "error");
            return;

        }

        namaJenis = "";
        tarif = "";
        kapasitas = "";
        modeTarif = "flat";
        tarifPerJam = "";
        gratisMenit = "";
        tarifJamPertama = "";
        tarifMaksHarian = "";

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

    tarif = item.tarif;

    kapasitas = item.kapasitas ?? "";

    modeTarif = item.mode_tarif || "flat";

    tarifPerJam = item.tarif_per_jam ?? "";

    gratisMenit = item.gratis_menit ?? "";

    tarifJamPertama = item.tarif_jam_pertama ?? "";

    tarifMaksHarian = item.tarif_maks_harian ?? "";

}

async function updateJenis() {

    try {

        const response = await apiFetch(

            `/jenis/${selectedId}`,

            {

                method: "PUT",

                headers:{

                    "Content-Type":"application/json"

                },

                body:JSON.stringify({

                    nama_jenis:namaJenis,

                    tarif:tarif,

                    kapasitas:kapasitas,

                    mode_tarif:modeTarif,

                    tarif_per_jam:tarifPerJam,

                    gratis_menit:gratisMenit,

                    tarif_jam_pertama:tarifJamPertama,

                    tarif_maks_harian:tarifMaksHarian

                })

            }

        );

        if (!response) return;

        const data = await response.json();

        if(!response.ok){

            showToast(data.message, "error");

            return;

        }

        showModal = false;

        editMode = false;

        namaJenis = "";

        tarif = "";

        kapasitas = "";

        modeTarif = "flat";

        tarifPerJam = "";
        gratisMenit = "";
        tarifJamPertama = "";
        tarifMaksHarian = "";

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

        const response = await apiFetch(
            `/jenis/${deleteId}`,
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

    <h1 class="text-3xl font-bold text-slate-800">Jenis kendaraan</h1>

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

                {#if isAdmin}
                <button
                    onclick={() => {
                        editMode = false;
                        selectedId = null;
                        namaJenis = "";
                        tarif = "";
                        kapasitas = "";
                        modeTarif = "flat";
                        tarifPerJam = "";
                        gratisMenit = "";
                        tarifJamPertama = "";
                        tarifMaksHarian = "";
                        showModal = true;
                    }}
                >
                    + Tambah Jenis
                </button>
                {/if}

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

                        <th>Tarif</th>

                        <th>Kapasitas</th>

                        {#if isAdmin}<th>Aksi</th>{/if}

                        </tr>

                </thead>

                <tbody>

                {#if filteredJenis.length === 0}

                <tr>

                    <td colspan="5" class="empty">

                        Data tidak ditemukan

                    </td>

                </tr>

                {:else}

                {#each filteredJenis as item,index}

                <tr class="row-anim" style="animation-delay:{index * 0.05}s">

                    <td>{index + 1}</td>

                    <td>{item.nama_jenis}</td>

                    <td>
                        {#if item.mode_tarif === "per_jam"}
                            {formatRupiah(item.tarif_per_jam)}/jam
                        {:else}
                            {formatRupiah(item.tarif)} (flat)
                        {/if}
                        {#if item.gratis_menit > 0 || (item.mode_tarif === "per_jam" && (item.tarif_jam_pertama !== null || item.tarif_maks_harian !== null))}
                            <div class="aturan-tarif">
                                {#if item.gratis_menit > 0}Gratis {item.gratis_menit} menit{/if}
                                {#if item.mode_tarif === "per_jam" && item.tarif_jam_pertama !== null}
                                    &middot; Jam 1: {formatRupiah(item.tarif_jam_pertama)}
                                {/if}
                                {#if item.mode_tarif === "per_jam" && item.tarif_maks_harian !== null}
                                    &middot; Maks {formatRupiah(item.tarif_maks_harian)}/hari
                                {/if}
                            </div>
                        {/if}
                    </td>

                    <td>
                        {#if item.kapasitas}
                            {item.terisi ?? 0}/{item.kapasitas} slot
                        {:else}
                            Tidak dibatasi
                        {/if}
                    </td>

                    {#if isAdmin}
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
                    {/if}

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

                    <input
                    type="number"
                    min="0"
                    step="500"
                    bind:value={tarif}
                    placeholder="Tarif flat (Rp) — dipakai jika mode tarif = Flat"
                    >

                    <label class="field-label" for="tarif-select">Mode Tarif</label>
                    <select id="tarif-select" bind:value={modeTarif}>
                        <option value="flat">Flat (tarif tetap per transaksi)</option>
                        <option value="per_jam">Per Jam (dihitung dari lama parkir)</option>
                    </select>

                    {#if modeTarif === "per_jam"}
                        <input
                        type="number"
                        min="0"
                        step="500"
                        bind:value={tarifPerJam}
                        placeholder="Tarif per jam (Rp)"
                        >

                        <label class="field-label" for="jam-pertama-input">Tarif Jam Pertama (opsional, kosong = sama dengan tarif per jam)</label>
                        <input
                            id="jam-pertama-input"
                            type="number"
                            min="0"
                            step="500"
                            bind:value={tarifJamPertama}
                            placeholder="Contoh: 5000"
                        />

                        <label class="field-label" for="maks-harian-input">Tarif Maksimum per Hari (opsional, kosong = tanpa batas)</label>
                        <input
                            id="maks-harian-input"
                            type="number"
                            min="1"
                            step="500"
                            bind:value={tarifMaksHarian}
                            placeholder="Contoh: 20000"
                        />
                    {/if}

                    <label class="field-label" for="gratis-input">Masa Gratis (menit, kosong = tidak ada)</label>
                    <input
                        id="gratis-input"
                        type="number"
                        min="0"
                        step="1"
                        bind:value={gratisMenit}
                        placeholder="Contoh: 15"
                    />

                    <label class="field-label" for="kapasitas-input">Kapasitas Slot (kosongkan = tidak dibatasi)</label>
                    <input
                        id="kapasitas-input"
                        type="number"
                        min="0"
                        step="1"
                        bind:value={kapasitas}
                        placeholder="Contoh: 20"
                    />

                    <div class="action">

                        <button
                            class="cancel"
                            onclick={() => {
                                showModal = false;
                                editMode = false;
                                selectedId = null;
                                namaJenis = "";
                                tarif = "";
                                kapasitas = "";
                                modeTarif = "flat";
                                tarifPerJam = "";
                                gratisMenit = "";
                                tarifJamPertama = "";
                                tarifMaksHarian = "";

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

    display:inline-flex;
    align-items:center;
    gap:6px;

}

.delete{

    background:#dc2626;

    color:white;

    display:inline-flex;
    align-items:center;
    gap:6px;

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

.modal-content input,
.modal-content select{

    width:100%;

    margin-top:20px;

    padding:12px;

    border:1px solid #ddd;

    border-radius:10px;

    font-family:inherit;

    font-size:14px;

}

.field-label{

    display:block;

    margin-top:14px;

    font-size:13px;

    font-weight:600;

    color:#475569;

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


.aturan-tarif{
    margin-top: 2px;
    font-size: 12px;
    color: #64748b;
}
</style>
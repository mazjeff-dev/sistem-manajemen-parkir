<script>

import { onMount } from "svelte";
import { apiFetch } from "../../../services/api.js";

import ShieldCheck from "lucide-svelte/icons/shield-check";
import ShieldOff from "lucide-svelte/icons/shield-off";
import UserCheck from "lucide-svelte/icons/user-check";
import UserX from "lucide-svelte/icons/user-x";

let users = $state([]);
let search = $state("");
let loading = $state(true);

let filteredUsers = $derived(
    users.filter((u) =>
        u.nama.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )
);

// Konfirmasi sebelum ubah role
let showRoleModal = $state(false);
let roleTarget = $state(null);
let roleBaru = $state("petugas");

// Konfirmasi sebelum aktif/nonaktifkan akun
let showStatusModal = $state(false);
let statusTarget = $state(null);

let toast = $state({
    show: false,
    message: "",
    type: "success"
});

async function loadUsers() {

    loading = true;

    try {

        const response = await apiFetch("/admin/users");

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message || "Gagal mengambil data user", "error");
            users = [];
            return;
        }

        users = [...data];

    } catch (err) {

        console.error(err);
        showToast("Gagal mengambil data user", "error");

    } finally {

        loading = false;

    }

}

function bukaUbahRole(item) {
    roleTarget = item;
    roleBaru = item.role === "admin" ? "petugas" : "admin";
    showRoleModal = true;
}

async function konfirmasiUbahRole() {

    try {

        const response = await apiFetch(`/admin/users/${roleTarget.id}/role`, {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({ role: roleBaru })

        });

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message, "error");
            return;
        }

        showRoleModal = false;
        roleTarget = null;

        showToast(data.message);

        await loadUsers();

    } catch (err) {

        console.error(err);
        showToast("Terjadi kesalahan", "error");

    }

}

function bukaUbahStatus(item) {
    statusTarget = item;
    showStatusModal = true;
}

async function konfirmasiUbahStatus() {

    try {

        const aktifBaru = !statusTarget.aktif;

        const response = await apiFetch(`/admin/users/${statusTarget.id}/status`, {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({ aktif: aktifBaru })

        });

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message, "error");
            return;
        }

        showStatusModal = false;
        statusTarget = null;

        showToast(data.message);

        await loadUsers();

    } catch (err) {

        console.error(err);
        showToast("Terjadi kesalahan", "error");

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
    loadUsers();
});

</script>

<div class="page">

    <h1 class="text-3xl font-bold text-slate-800">Kelola User</h1>

    <p class="total-data">
        Total Data : <b>{filteredUsers.length}</b>
    </p>

    <div class="toolbar">

        <input
            type="text"
            bind:value={search}
            placeholder="🔍 Cari nama / email..."
        />

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
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Aksi</th>
            </tr>
        </thead>

        <tbody>

        {#if filteredUsers.length === 0}

        <tr>
            <td colspan="6" class="empty">
                Data tidak ditemukan
            </td>
        </tr>

        {:else}

        {#each filteredUsers as item, index}

        <tr class="row-anim" style="animation-delay:{index * 0.05}s">
            <td>{index + 1}</td>
            <td>
                {item.nama}
            </td>
            <td>{item.email}</td>
            <td>
                <span class="badge {item.role === 'admin' ? 'role-admin' : 'role-petugas'}">
                    {item.role === "admin" ? "Admin" : "Petugas"}
                </span>
            </td>
            <td>
                <span class="badge {item.aktif ? 'status-aktif' : 'status-nonaktif'}">
                    {item.aktif ? "Aktif" : "Nonaktif"}
                </span>
            </td>
            <td>
                <div class="row-actions">

                    <button class="role-btn" onclick={() => bukaUbahRole(item)}>
                        {#if item.role === "admin"}
                            <ShieldOff size={16}/>
                            Jadikan Petugas
                        {:else}
                            <ShieldCheck size={16}/>
                            Jadikan Admin
                        {/if}
                    </button>

                    {#if item.aktif}
                        <button class="nonaktif-btn" onclick={() => bukaUbahStatus(item)}>
                            <UserX size={16}/>
                            Nonaktifkan
                        </button>
                    {:else}
                        <button class="aktif-btn" onclick={() => bukaUbahStatus(item)}>
                            <UserCheck size={16}/>
                            Aktifkan
                        </button>
                    {/if}

                </div>
            </td>
        </tr>

        {/each}

        {/if}

        </tbody>

    </table>

    {#if showRoleModal && roleTarget}

    <div class="modal">

        <div class="delete-card">

            <div class="icon">🔑</div>

            <h2>Ubah Role User?</h2>

            <p>
                Ubah role <b>{roleTarget.nama}</b> ({roleTarget.email})
                dari <b>{roleTarget.role === "admin" ? "Admin" : "Petugas"}</b>
                menjadi <b>{roleBaru === "admin" ? "Admin" : "Petugas"}</b>?
            </p>

            <div class="action">

                <button class="cancel" onclick={() => {
                    showRoleModal = false;
                    roleTarget = null;
                }}>
                    Batal
                </button>

                <button class="confirm" onclick={konfirmasiUbahRole}>
                    Ya, Ubah Role
                </button>

            </div>

        </div>

    </div>

    {/if}

    {#if showStatusModal && statusTarget}

    <div class="modal">

        <div class="delete-card">

            <div class="icon">{statusTarget.aktif ? "🚫" : "✅"}</div>

            <h2>
                {statusTarget.aktif ? "Nonaktifkan Akun?" : "Aktifkan Kembali Akun?"}
            </h2>

            <p>
                {#if statusTarget.aktif}
                    Akun <b>{statusTarget.nama}</b> ({statusTarget.email}) tidak akan
                    bisa login lagi sampai diaktifkan kembali.
                {:else}
                    Akun <b>{statusTarget.nama}</b> ({statusTarget.email}) akan bisa
                    login kembali seperti biasa.
                {/if}
            </p>

            <div class="action">

                <button class="cancel" onclick={() => {
                    showStatusModal = false;
                    statusTarget = null;
                }}>
                    Batal
                </button>

                <button class={statusTarget.aktif ? "danger" : "confirm"} onclick={konfirmasiUbahStatus}>
                    {statusTarget.aktif ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
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
}

tr:hover{
    background:#f8fafc;
    transition:background .2s;
}

.badge{
    padding:5px 12px;
    border-radius:20px;
    font-weight:600;
    font-size:13px;
    color:white;
}

.role-admin{
    background:#7c3aed;
}

.role-petugas{
    background:#0284c7;
}

.status-aktif{
    background:#16a34a;
}

.status-nonaktif{
    background:#dc2626;
}

.row-actions{
    display:flex;
    flex-wrap:wrap;
    gap:8px;
}

.row-actions button{
    padding:8px 12px;
    font-size:13px;
    white-space:nowrap;
}

.role-btn{
    background:#7c3aed;
}

.role-btn:hover{
    background:#6d28d9;
}

.aktif-btn{
    background:#16a34a;
}

.aktif-btn:hover{
    background:#15803d;
}

.nonaktif-btn{
    background:#dc2626;
}

.nonaktif-btn:hover{
    background:#b91c1c;
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

.confirm{
    background:#16a34a;
}

.confirm:hover{
    background:#15803d;
}

.danger{
    background:#dc2626;
}

.danger:hover{
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

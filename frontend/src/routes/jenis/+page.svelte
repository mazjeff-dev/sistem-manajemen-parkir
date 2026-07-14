<script>

import { onMount } from "svelte";
import BASE_URL from "../../services/api.js";
import Sidebar from "../../lib/Sidebar.svelte";
import Navbar from "../../lib/Navbar.svelte";

console.log("HALAMAN JENIS BERHASIL DIMUAT");

let jenis = $state([]);

async function loadJenis() {
    try {

        const token = localStorage.getItem("token");

        const response = await fetch(`${BASE_URL}/jenis`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        console.log("Data API:", data);

        jenis = [...data];

        console.log("Isi variabel jenis:", jenis);
        console.log("Panjang:", jenis.length);

    } catch (err) {

        console.error(err);

    }
}

onMount(() => {
    console.log("onMount berjalan");
    loadJenis();
});

</script>

<div class="container">

    <Sidebar/>

    <div class="content">

        <Navbar/>

        <div class="page">

            <h1>Jenis Kendaraan</h1>

            <button>
                + Tambah Jenis
            </button>

            <table>

                <thead>

                    <tr>

                        <th>No</th>

                        <th>Nama Jenis</th>

                        <th>Aksi</th>

                        </tr>

                 </thead>

                 <tbody>

                    {#each jenis as item,index}

                    <tr>

                         <td>{index+1}</td>

                         <td>{item.nama_jenis}</td>

                         <td>

                            <button class="edit">
                                Edit
                            </button>

                            <button class="delete">
                                Delete
                            </button>

                        </td>

                    </tr>

                    {/each}

                </tbody>

            </table>

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

}

button:hover{

    background:#1d4ed8;

}

table{

    width:100%;

    margin-top:25px;

    border-collapse:collapse;

    background:white;

    border-radius:12px;

    overflow:hidden;

    box-shadow:0 5px 15px rgba(0,0,0,.08);

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


</style>
<script>
    import { onMount } from "svelte";
    import BASE_URL from "../../services/api.js";

    let dashboard = {
        total_kendaraan: 0,
        total_parkir: 0,
        sedang_parkir: 0,
        sudah_keluar: 0,
        jenis: []
    };

    async function loadDashboard() {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${BASE_URL}/dashboard`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            dashboard = data;

        } catch (error) {
            console.log(error);
        }
    }

    onMount(() => {
        loadDashboard();
    });
</script>

<h1>Dashboard Sistem Manajemen Parkir</h1>

<hr>

<h3>Total Kendaraan : {dashboard.total_kendaraan}</h3>

<h3>Total Parkir : {dashboard.total_parkir}</h3>

<h3>Sedang Parkir : {dashboard.sedang_parkir}</h3>

<h3>Sudah Keluar : {dashboard.sudah_keluar}</h3>

<hr>

<h2>Jenis Kendaraan</h2>

<ul>
    {#each dashboard.jenis as item}
        <li>{item.nama_jenis} : {item.jumlah}</li>
    {/each}
</ul>
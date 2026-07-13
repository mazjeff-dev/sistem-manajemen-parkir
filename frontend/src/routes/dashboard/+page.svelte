<script>
    import { onMount } from "svelte";
    import BASE_URL from "../../services/api.js";
    import Sidebar from "../../lib/Sidebar.svelte";
    import Navbar from "../../lib/Navbar.svelte";

    import {
        CarFront,
        SquareParking,
        CircleCheckBig,
        LogOut
    } from "lucide-svelte";

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

<div class="container">

    <Sidebar />

    <div class="content">

        <Navbar />

        <div class="dashboard">

            <div class="dashboard-header">

                <h1>Dashboard</h1>

                <p>Selamat datang di Sistem Manajemen Parkir 🚗</p>

            </div>

            <div class="card blue">

                <div>

                    <h3>Total Kendaraan</h3>

                    <h2>{dashboard.total_kendaraan}</h2>

                </div>

                <CarFront size="55"/>

            </div>

            <div class="card green">

                <div>

                    <h3>Total Parkir</h3>

                    <h2>{dashboard.total_parkir}</h2>

                </div>

                <SquareParking size="55"/>

            </div>

            <div class="card orange">

                <div>

                    <h3>Sedang Parkir</h3>

                    <h2>{dashboard.sedang_parkir}</h2>

                </div>

                <CircleCheckBig size="55"/>

            </div>

            <div class="card red">

                <div>

                    <h3>Sudah Keluar</h3>

                    <h2>{dashboard.sudah_keluar}</h2>

                </div>

                <LogOut size="55"/>

            </div>

            <div class="card jenis">

                <h3>Jenis Kendaraan</h3>

                {#each dashboard.jenis as item}

                    <div class="jenis-item">

                        <span>{item.nama_jenis}</span>

                        <span class="badge">

                            {item.jumlah}

                        </span>

                    </div>

                {/each}

            </div>

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

.dashboard{

    padding:35px;

    display:grid;

    grid-template-columns:repeat(auto-fit,minmax(230px,1fr));

    gap:22px;

    animation:fadeDashboard .8s ease;

}

.dashboard-header{

    grid-column:1/-1;

}

.dashboard-header h1{

    font-size:34px;

    color:#1e293b;

}

.dashboard-header p{

    color:#64748b;

    margin-top:8px;

}

.card{

    border-radius:18px;

    padding:25px;

    color:white;

    display:flex;

    justify-content:space-between;

    align-items:center;

    box-shadow:0 10px 25px rgba(0,0,0,.08);

    transition:.35s;

    opacity:0;

    animation:slideFromRight .7s forwards;

}

.card:hover{

    transform:translateY(-8px) scale(1.02);

}

.card:nth-child(2){

    animation-delay:.2s;

}

.card:nth-child(3){

    animation-delay:.4s;

}

.card:nth-child(4){

    animation-delay:.6s;

}

.card:nth-child(5){

    animation-delay:.8s;

}

.card h3{

    font-size:15px;

    opacity:.9;

}

.card h2{

    font-size:48px;

    margin-top:12px;

    font-weight:bold;

}

.blue{

    background:linear-gradient(135deg,#2563eb,#3b82f6);

}

.green{

    background:linear-gradient(135deg,#16a34a,#22c55e);

}

.orange{

    background:linear-gradient(135deg,#ea580c,#fb923c);

}

.red{

    background:linear-gradient(135deg,#dc2626,#ef4444);

}

.jenis{

    grid-column:1/-1;

    background:white;

    color:#1e293b;

    display:block;

}

.jenis h3{

    font-size:22px;

    margin-bottom:18px;

    color:#0f172a;

}

.jenis-item{

    display:flex;

    justify-content:space-between;

    align-items:center;

    padding:14px 0;

    border-bottom:1px solid #e5e7eb;

}

.badge{

    background:#2563eb;

    color:white;

    padding:5px 14px;

    border-radius:20px;

    font-weight:bold;

}

@keyframes slideFromRight{

    from{

        opacity:0;

        transform:translateX(70px);

    }

    to{

        opacity:1;

        transform:translateX(0);

    }

}

@keyframes fadeDashboard{

    from{

        opacity:0;

    }

    to{

        opacity:1;

    }

}

</style>
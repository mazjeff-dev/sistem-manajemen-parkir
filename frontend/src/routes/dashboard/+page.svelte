<script>
    import { onMount } from "svelte";
    import BASE_URL from "../../services/api.js";
    import Sidebar from "../../lib/Sidebar.svelte";
    import Navbar from "../../lib/Navbar.svelte";

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


            <div class="card blue">
                <h3>Total Kendaraan</h3>
                <h2>{dashboard.total_kendaraan}</h2>
            </div>

            <div class="card green">
                <h3>Total Parkir</h3>
                <h2>{dashboard.total_parkir}</h2>
            </div>

            <div class="card orange">
                <h3>Sedang Parkir</h3>
                <h2>{dashboard.sedang_parkir}</h2>
            </div>

            <div class="card red">
                <h3>Sudah Keluar</h3>
                <h2>{dashboard.sudah_keluar}</h2>
            </div>
            
            <div class="card jenis">
                <h3>Jenis Kendaraan</h3>

                <ul>
                    {#each dashboard.jenis as item}
                        <li>{item.nama_jenis} : {item.jumlah}</li>
                    {/each}
                </ul>
            </div>

        </div>

    </div>

</div>


<style>

.container{
    display:flex;
    min-height:100vh;
    background:#f1f5f9;
}


.content{
    flex:1;
}


.dashboard{

    padding:30px;

    display:grid;

    grid-template-columns:repeat(4,1fr);

    gap:20px;

    animation: fadeDashboard 0.8s ease-out;


}



.card{

    background:white;

    border-radius:16px;

    padding:25px;

    box-shadow:0 5px 15px rgba(0,0,0,.08);


    opacity:0;

    animation: slideFromRight 0.6s ease-out forwards;

}

.card:hover{
    
    transform:translateY(-5px);

    transition:.3s;
}

.card:nth-child(1){

    animation-delay:0.1s;

}


.card:nth-child(2){

    animation-delay:0.3s;

}


.card:nth-child(3){

    animation-delay:0.5s;

}


.card:nth-child(4){

    animation-delay:0.7s;

}


.card:nth-child(5){

    animation-delay:0.9s;

}


.card h3{

    color:#64748b;

    font-size:15px;

}



.card h2{

    font-size:36px;

    margin-top:15px;

}



.blue{
    border-left:8px solid #2563eb;
}


.green{
    border-left:8px solid #16a34a;
}


.orange{
    border-left:8px solid #f97316;
}


.red{
    border-left:8px solid #dc2626;
}



.jenis{

    grid-column:span 4;

}



.jenis ul{

    margin-top:15px;

}


.jenis li{

    display:flex;

    justify-content:space-between;

    padding:12px;

    border-bottom:1px solid #eee;

}


.jenis span{

    font-weight:bold;

}


@keyframes slideFromRight{

    from{

        opacity:0;

        transform:translateX(80px);

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
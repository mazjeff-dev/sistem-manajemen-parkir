<script>
    import { onMount } from "svelte";
    import { apiFetch } from "../../services/api.js";
    import { profileInfo } from "../../stores/profile.js";
    import WelcomeCard from "../../lib/WelcomeCard.svelte";
    import DigitalClock from "../../lib/DigitalClock.svelte";
    import MiniCalendar from "../../lib/MiniCalendar.svelte";
    import RecentActivity from "../../lib/RecentActivity.svelte";
    import Card from "../../lib/Card.svelte";
    import QuoteCard from "../../lib/QuoteCard.svelte";
    import BarChart from "../../lib/charts/BarChart.svelte";
    import PieChart from "../../lib/charts/PieChart.svelte";
    import LineChart from "../../lib/charts/LineChart.svelte";

    import CarFront from "lucide-svelte/icons/car-front";
    import SquareParking from "lucide-svelte/icons/square-parking";
    import CircleCheckBig from "lucide-svelte/icons/circle-check-big";
    import LogOut from "lucide-svelte/icons/log-out";
    import CalendarDays from "lucide-svelte/icons/calendar-days";
    import CalendarRange from "lucide-svelte/icons/calendar-range";
    import Wallet from "lucide-svelte/icons/wallet";
    import Banknote from "lucide-svelte/icons/banknote";
    import TrendingUp from "lucide-svelte/icons/trending-up";
    import Car from "lucide-svelte/icons/car";
    import CircleCheck from "lucide-svelte/icons/circle-check";
    import Receipt from "lucide-svelte/icons/receipt";

    let dashboard = $state({
        total_kendaraan: 0,
        total_parkir: 0,
        sedang_parkir: 0,
        sudah_keluar: 0,
        jenis: []
    });

    let analytics = $state({
        kendaraan_masuk_per_hari: [],
        kendaraan_keluar_per_hari: [],
        jenis_kendaraan: [],
        ringkasan_hari_ini: 0,
        ringkasan_bulan_ini: 0,
        recent_activity: []
    });

    let revenue = $state({
        today: 0,
        month: 0,
        year: 0,
        activeVehicles: 0,
        completedVehicles: 0,
        totalTransactions: 0
    });

    let slots = $state([]);

    let loading = $state(true);

    async function loadDashboard() {

        try {
            const [dashboardRes, analyticsRes, revenueRes, slotsRes] = await Promise.all([
                apiFetch("/dashboard"),
                apiFetch("/dashboard/analytics"),
                apiFetch("/dashboard/revenue"),
                apiFetch("/dashboard/slots")
            ]);

            // apiFetch mengembalikan null kalau tidak ada token atau
            // token expired (401) — redirect ke login sudah ditangani
            // otomatis di dalam apiFetch.
            if (!dashboardRes || !analyticsRes || !revenueRes || !slotsRes) {
                return;
            }

            dashboard = await dashboardRes.json();
            analytics = await analyticsRes.json();
            revenue = await revenueRes.json();
            slots = await slotsRes.json();

        } catch (error) {
            console.error(error);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadDashboard();
    });
</script>

<div class="p-8 flex flex-col gap-6">

    {#if loading}

        <div class="dashboard-loading">
            <div class="spinner"></div>
            <p>Memuat data dashboard...</p>
        </div>

    {:else}

    <WelcomeCard nama={$profileInfo.nama} />

    <!-- Widget: jam, kata-kata, kalender, ringkasan -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 widget-row">

        <div class="widget-in flex flex-col gap-6" style="animation-delay:0ms">
            <DigitalClock />
            <QuoteCard />
        </div>

        <div class="widget-in" style="animation-delay:80ms">
            <MiniCalendar />
        </div>

                <Card
                    title="Kendaraan Hari Ini"
                    value={analytics.ringkasan_hari_ini}
                    icon={CalendarDays}
                    variant="white"
                    delay={160}
                />

                <Card
                    title="Kendaraan Bulan Ini"
                    value={analytics.ringkasan_bulan_ini}
                    icon={CalendarRange}
                    variant="white"
                    delay={240}
                />

            </div>

            <!-- Ringkasan utama -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                <Card
                    title="Total Kendaraan"
                    value={dashboard.total_kendaraan}
                    icon={CarFront}
                    variant="blue"
                    delay={0}
                />

                <Card
                    title="Total Parkir"
                    value={dashboard.total_parkir}
                    icon={SquareParking}
                    variant="green"
                    delay={80}
                />

                <Card
                    title="Sedang Parkir"
                    value={dashboard.sedang_parkir}
                    icon={CircleCheckBig}
                    variant="orange"
                    delay={160}
                />

                <Card
                    title="Sudah Keluar"
                    value={dashboard.sudah_keluar}
                    icon={LogOut}
                    variant="red"
                    delay={240}
                />

            </div>

            <!-- Kapasitas / Slot Parkir per jenis kendaraan -->
            {#if slots.length > 0}
            <div class="rounded-2xl p-6 bg-white shadow-md fade-in-up" style="animation-delay:60ms">

                <h3 class="slot-title">
                    <SquareParking size={20}/>
                    Kapasitas Slot Parkir
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 slot-grid">

                    {#each slots as s}

                        <div class="slot-card" class:penuh={!s.unlimited && s.sisa === 0}>

                            <p class="slot-nama">{s.nama_jenis}</p>

                            {#if s.unlimited}

                                <p class="slot-jumlah">{s.terisi} <span>terisi</span></p>
                                <p class="slot-sub">Tidak dibatasi</p>

                            {:else}

                                <p class="slot-jumlah">{s.terisi}<span>/{s.kapasitas}</span></p>

                                <div class="slot-bar">
                                    <div
                                        class="slot-bar-fill"
                                        style="width:{Math.min(100, (s.terisi / s.kapasitas) * 100)}%"
                                    ></div>
                                </div>

                                <p class="slot-sub">
                                    {s.sisa === 0 ? "Penuh" : `Sisa ${s.sisa} slot`}
                                </p>

                            {/if}

                        </div>

                    {/each}

                </div>

            </div>
            {/if}

            <!-- Pendapatan -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                <Card
                    title="Pendapatan Hari Ini"
                    value={revenue.today}
                    format="currency"
                    icon={Wallet}
                    variant="blue"
                    delay={0}
                />

                <Card
                    title="Pendapatan Bulan Ini"
                    value={revenue.month}
                    format="currency"
                    icon={Banknote}
                    variant="green"
                    delay={80}
                />

                <Card
                    title="Pendapatan Tahun Ini"
                    value={revenue.year}
                    format="currency"
                    icon={TrendingUp}
                    variant="orange"
                    delay={160}
                />

                <Card
                    title="Kendaraan Aktif"
                    value={revenue.activeVehicles}
                    icon={Car}
                    variant="white"
                    delay={240}
                />

                <Card
                    title="Kendaraan Selesai"
                    value={revenue.completedVehicles}
                    icon={CircleCheck}
                    variant="white"
                    delay={320}
                />

                <Card
                    title="Total Transaksi"
                    value={revenue.totalTransactions}
                    icon={Receipt}
                    variant="white"
                    delay={400}
                />

            </div>

            <!-- Chart -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div class="rounded-2xl p-6 bg-white shadow-md fade-in-up" style="animation-delay:100ms">
                    <BarChart
                        title="Kendaraan Masuk per Hari (7 Hari Terakhir)"
                        data={analytics.kendaraan_masuk_per_hari}
                    />
                </div>

                <div class="rounded-2xl p-6 bg-white shadow-md fade-in-up" style="animation-delay:180ms">
                    <PieChart
                        title="Jenis Kendaraan"
                        data={analytics.jenis_kendaraan}
                    />
                </div>

            </div>

            <div class="rounded-2xl p-6 bg-white shadow-md fade-in-up" style="animation-delay:260ms">
                <LineChart
                    title="Statistik Parkir (Masuk vs Keluar)"
                    masuk={analytics.kendaraan_masuk_per_hari}
                    keluar={analytics.kendaraan_keluar_per_hari}
                />
            </div>

    <div class="fade-in-up" style="animation-delay:340ms">
        <RecentActivity data={analytics.recent_activity} />
    </div>

    {/if}

</div>

<style>
.dashboard-loading{
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:16px;
    padding:100px 0;
    color:#64748b;
}

.spinner{
    width:42px;
    height:42px;
    border:4px solid #e2e8f0;
    border-top-color:#2563eb;
    border-radius:50%;
    animation:spin .8s linear infinite;
}

@keyframes spin{
    to{ transform:rotate(360deg); }
}

.widget-in{
    opacity:0;
    animation: widgetIn .5s ease forwards;
}

.fade-in-up{
    opacity:0;
    animation: widgetIn .5s ease forwards;
}

@keyframes widgetIn{
    from{
        opacity:0;
        transform: translateY(14px);
    }
    to{
        opacity:1;
        transform: translateY(0);
    }
}

.slot-title{
    display:flex;
    align-items:center;
    gap:8px;
    font-size:16px;
    font-weight:700;
    color:#0f172a;
    margin-bottom:16px;
}

.slot-grid{
    margin-top:4px;
}

.slot-card{
    background:#f8fafc;
    border:1px solid #e2e8f0;
    border-radius:14px;
    padding:16px;
}

.slot-card.penuh{
    background:#fef2f2;
    border-color:#fecaca;
}

.slot-nama{
    font-size:13px;
    font-weight:600;
    color:#64748b;
    margin-bottom:6px;
}

.slot-jumlah{
    font-size:22px;
    font-weight:800;
    color:#0f172a;
}

.slot-jumlah span{
    font-size:14px;
    font-weight:600;
    color:#94a3b8;
}

.slot-bar{
    width:100%;
    height:6px;
    background:#e2e8f0;
    border-radius:999px;
    margin:8px 0;
    overflow:hidden;
}

.slot-bar-fill{
    height:100%;
    background:#2563eb;
    border-radius:999px;
    transition:width .4s ease;
}

.penuh .slot-bar-fill{
    background:#dc2626;
}

.slot-sub{
    font-size:12px;
    color:#64748b;
}
</style>

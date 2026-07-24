<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import BASE_URL from "../../services/api.js";
    import { logout } from "../../stores/auth.js";
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

    import {
        CarFront,
        SquareParking,
        CircleCheckBig,
        LogOut,
        CalendarDays,
        CalendarRange,
        Wallet,
        Banknote,
        TrendingUp,
        Car,
        CircleCheck,
        Receipt
    } from "lucide-svelte";

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

    let loading = $state(true);

    function handleUnauthorized() {
        logout();
        goto("/");
    }

    async function loadDashboard() {
        const token = localStorage.getItem("token");

        if (!token) {
            handleUnauthorized();
            return;
        }

        try {
            const [dashboardRes, analyticsRes, revenueRes] = await Promise.all([
                fetch(`${BASE_URL}/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${BASE_URL}/dashboard/analytics`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${BASE_URL}/dashboard/revenue`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (dashboardRes.status === 401 || analyticsRes.status === 401 || revenueRes.status === 401) {
                handleUnauthorized();
                return;
            }

            dashboard = await dashboardRes.json();
            analytics = await analyticsRes.json();
            revenue = await revenueRes.json();

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
</style>

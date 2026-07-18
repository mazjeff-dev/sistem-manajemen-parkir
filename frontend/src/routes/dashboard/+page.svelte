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
        CalendarRange
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
            const [dashboardRes, analyticsRes] = await Promise.all([
                fetch(`${BASE_URL}/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${BASE_URL}/dashboard/analytics`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (dashboardRes.status === 401 || analyticsRes.status === 401) {
                handleUnauthorized();
                return;
            }

            dashboard = await dashboardRes.json();
            analytics = await analyticsRes.json();

        } catch (error) {
            console.log(error);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadDashboard();
    });
</script>

<div class="p-8 flex flex-col gap-6">

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

</div>

<style>
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

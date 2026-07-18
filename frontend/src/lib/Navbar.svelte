<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { Bell, UserCircle2, CarFront, LogOut } from "lucide-svelte";
    import BASE_URL, { SERVER_URL } from "../services/api.js";
    import { profileInfo } from "../stores/profile.js";

    let notifOpen = $state(false);
    let notifications = $state([]);
    let loadingNotif = $state(false);

    const judulHalaman = {
        "/dashboard": "Dashboard Administrator",
        "/jenis": "Manajemen Jenis Kendaraan",
        "/kendaraan": "Manajemen Data Kendaraan",
        "/parkir": "Manajemen Data Parkir",
        "/laporan": "Laporan Parkir",
        "/profile": "Pengaturan Profil"
    };

    let subtitle = $derived(
        judulHalaman[page.url.pathname] ?? "Dashboard Administrator"
    );

    async function loadProfile() {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await fetch(`${BASE_URL}/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) return;

            const data = await response.json();

            profileInfo.set({
                nama: data.nama || "Administrator",
                foto: data.foto || null
            });

        } catch (error) {
            console.log(error);
        }
    }

    async function loadNotifikasi() {

        loadingNotif = true;

        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await fetch(`${BASE_URL}/dashboard/analytics`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) return;

            const data = await response.json();

            notifications = (data.recent_activity || []).slice(0, 5);

        } catch (error) {
            console.log(error);
        } finally {
            loadingNotif = false;
        }

    }

    function toggleNotif() {
        notifOpen = !notifOpen;

        if (notifOpen && notifications.length === 0 && !loadingNotif) {
            loadNotifikasi();
        }
    }

    function formatWaktu(waktu) {
        if (!waktu) return "-";
        return new Date(waktu).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    onMount(() => {
        loadProfile();
        loadNotifikasi();
    });
</script>

<nav class="bg-white shadow-md px-8 py-5 flex justify-between items-center relative z-30">

    <div>

        <h1 class="text-2xl font-bold text-slate-800">
            Sistem Manajemen Parkir
        </h1>

        <p class="text-gray-500">
            {subtitle}
        </p>

    </div>

    <div class="flex items-center gap-5">

        <div class="relative">

            <button
                onclick={toggleNotif}
                class="relative text-gray-500 hover:text-blue-600 transition"
                aria-label="Notifikasi"
            >
                <Bell size={22}/>

                {#if notifications.length > 0}
                    <span class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                        {notifications.length}
                    </span>
                {/if}
            </button>

            {#if notifOpen}

                <button
                    class="fixed inset-0 z-30 cursor-default"
                    onclick={() => notifOpen = false}
                    aria-label="Tutup notifikasi"
                ></button>

                <div class="notif-panel absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-40 overflow-hidden">

                    <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h3 class="font-semibold text-slate-800">Notifikasi</h3>
                        <span class="text-xs text-slate-400">Aktivitas terbaru</span>
                    </div>

                    <div class="max-h-80 overflow-y-auto">

                        {#if loadingNotif}
                            <p class="text-sm text-slate-400 text-center py-6">Memuat notifikasi...</p>
                        {:else if notifications.length === 0}
                            <p class="text-sm text-slate-400 text-center py-6">Belum ada notifikasi</p>
                        {:else}
                            {#each notifications as item, index}
                                <div
                                    class="notif-item flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition"
                                    style="animation-delay:{index * 60}ms"
                                >
                                    <div
                                        class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                                        class:bg-green-100={item.status === "Parkir"}
                                        class:text-green-700={item.status === "Parkir"}
                                        class:bg-slate-100={item.status !== "Parkir"}
                                        class:text-slate-600={item.status !== "Parkir"}
                                    >
                                        {#if item.status === "Parkir"}
                                            <CarFront size={16}/>
                                        {:else}
                                            <LogOut size={16}/>
                                        {/if}
                                    </div>

                                    <div class="min-w-0">
                                        <p class="text-sm text-slate-700">
                                            <b>{item.plat_nomor}</b>
                                            {item.status === "Parkir" ? "masuk area parkir" : "keluar area parkir"}
                                        </p>
                                        <p class="text-xs text-slate-400 mt-0.5">
                                            {item.nama_jenis} ·
                                            {formatWaktu(item.status === "Parkir" ? item.waktu_masuk : item.waktu_keluar)}
                                        </p>
                                    </div>
                                </div>
                            {/each}
                        {/if}

                    </div>

                </div>

            {/if}

        </div>

        <button
            onclick={() => goto("/profile")}
            class="flex items-center gap-2 hover:opacity-80 transition"
        >

            {#if $profileInfo.foto}
                <img
                    src={`${SERVER_URL}/uploads/profile/${$profileInfo.foto}`}
                    alt="Foto profil"
                    class="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
                />
            {:else}
                <UserCircle2 size={40} class="text-blue-600"/>
            {/if}

            <div class="text-left">

                <h3 class="font-semibold">
                    {$profileInfo.nama}
                </h3>

                <p class="text-gray-500 text-sm">
                    Online
                </p>

            </div>

        </button>

    </div>

</nav>

<style>

nav{

    animation: navbarDown 0.7s ease-out;

}



@keyframes navbarDown{

    from{

        opacity:0;

        transform:translateY(-30px);

    }


    to{

        opacity:1;

        transform:translateY(0);

    }

}

.notif-panel{
    animation: notifDrop .2s ease;
    transform-origin: top right;
}

@keyframes notifDrop{
    from{
        opacity:0;
        transform: scale(.95) translateY(-8px);
    }
    to{
        opacity:1;
        transform: scale(1) translateY(0);
    }
}

.notif-item{
    opacity:0;
    animation: notifItemIn .3s ease forwards;
}

@keyframes notifItemIn{
    from{
        opacity:0;
        transform: translateX(-8px);
    }
    to{
        opacity:1;
        transform: translateX(0);
    }
}

</style>

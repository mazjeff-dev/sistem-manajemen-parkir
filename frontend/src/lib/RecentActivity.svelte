<script>
    let { data = [] } = $props();

    function formatWaktu(waktu) {
        if (!waktu) return "-";
        return new Date(waktu).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    }
</script>

<div class="activity-card rounded-2xl p-6 bg-white shadow-md">
    <h3 class="text-slate-800 font-semibold text-lg mb-4">Aktivitas Terbaru</h3>

    {#if !data.length}
        <p class="text-slate-400 text-sm">Belum ada aktivitas</p>
    {:else}
        <div class="flex flex-col divide-y divide-slate-100">
            {#each data as item, index}
                <div
                    class="activity-row py-3 flex items-center justify-between gap-3"
                    style="animation-delay:{index * 70}ms"
                >
                    <div>
                        <p class="font-medium text-slate-700">
                            {item.plat_nomor} · {item.nama_pemilik}
                        </p>
                        <p class="text-xs text-slate-400 mt-0.5">
                            {item.nama_jenis} · Masuk {formatWaktu(item.waktu_masuk)}
                            {#if item.waktu_keluar}
                                · Keluar {formatWaktu(item.waktu_keluar)}
                            {/if}
                        </p>
                    </div>

                    <span
                        class="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
                        class:bg-green-100={item.status === "Parkir"}
                        class:text-green-700={item.status === "Parkir"}
                        class:bg-slate-100={item.status !== "Parkir"}
                        class:text-slate-600={item.status !== "Parkir"}
                    >
                        {item.status}
                    </span>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
.activity-card{
    opacity:0;
    animation: activityCardIn .5s ease forwards;
}

@keyframes activityCardIn{
    from{
        opacity:0;
        transform: translateY(14px);
    }
    to{
        opacity:1;
        transform: translateY(0);
    }
}

.activity-row{
    opacity:0;
    animation: rowSlideIn .4s ease forwards;
}

@keyframes rowSlideIn{
    from{
        opacity:0;
        transform: translateX(-12px);
    }
    to{
        opacity:1;
        transform: translateX(0);
    }
}
</style>

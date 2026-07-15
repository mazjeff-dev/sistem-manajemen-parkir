<script>
    const today = new Date();
    const namaHari = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const namaBulan = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const tahun = today.getFullYear();
    const bulan = today.getMonth();
    const tanggalHariIni = today.getDate();

    const hariPertama = new Date(tahun, bulan, 1).getDay();
    const jumlahHari = new Date(tahun, bulan + 1, 0).getDate();

    let sel = [];
    for (let i = 0; i < hariPertama; i++) sel.push(null);
    for (let d = 1; d <= jumlahHari; d++) sel.push(d);
</script>

<div class="calendar-card rounded-2xl p-5 bg-white shadow-md">
    <h3 class="text-slate-800 font-semibold text-center mb-3">
        {namaBulan[bulan]} {tahun}
    </h3>

    <div class="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 mb-1">
        {#each namaHari as h}
            <span>{h}</span>
        {/each}
    </div>

    <div class="grid grid-cols-7 gap-1 text-center text-sm">
        {#each sel as d}
            <span
                class="h-7 flex items-center justify-center rounded-full"
                class:bg-blue-600={d === tanggalHariIni}
                class:text-white={d === tanggalHariIni}
                class:font-bold={d === tanggalHariIni}
                class:text-slate-600={d !== tanggalHariIni}
                class:today-pulse={d === tanggalHariIni}
            >
                {d ?? ""}
            </span>
        {/each}
    </div>
</div>

<style>
.calendar-card{
    opacity:0;
    animation: calendarIn .5s ease .08s forwards;
    transition: transform .25s ease, box-shadow .25s ease;
}

.calendar-card:hover{
    transform: translateY(-4px);
    box-shadow: 0 14px 28px rgba(0,0,0,.12);
}

@keyframes calendarIn{
    from{
        opacity:0;
        transform: scale(.92);
    }
    to{
        opacity:1;
        transform: scale(1);
    }
}

.today-pulse{
    animation: todayPulse 2s ease-in-out infinite;
}

@keyframes todayPulse{
    0%, 100%{ box-shadow: 0 0 0 0 rgba(37,99,235,.45); }
    50%{ box-shadow: 0 0 0 5px rgba(37,99,235,0); }
}
</style>

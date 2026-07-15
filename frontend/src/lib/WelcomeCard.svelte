<script>
    let { nama = "Administrator" } = $props();

    function sapaan() {
        const jam = new Date().getHours();
        if (jam < 11) return "Selamat pagi";
        if (jam < 15) return "Selamat siang";
        if (jam < 18) return "Selamat sore";
        return "Selamat malam";
    }
</script>

<div class="welcome-card rounded-2xl p-6 text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-900/20 flex items-center justify-between">
    <div>
        <p class="text-blue-100 text-sm">{sapaan()},</p>
        <h2 class="text-2xl font-bold mt-1 wave">{nama} 👋</h2>
        <p class="text-blue-100 text-sm mt-2">
            Berikut ringkasan aktivitas parkir hari ini.
        </p>
    </div>
</div>

<style>
.welcome-card{
    opacity:0;
    animation: welcomeIn .55s ease forwards;
}

@keyframes welcomeIn{
    from{
        opacity:0;
        transform: translateY(-16px);
    }
    to{
        opacity:1;
        transform: translateY(0);
    }
}

.wave{
    display:inline-block;
}
</style>

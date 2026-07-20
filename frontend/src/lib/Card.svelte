<script>
    import { untrack } from "svelte";

    let {
        title = "",
        value = 0,
        icon = null,
        variant = "white",
        delay = 0,
        format = "number"
    } = $props();

    const variants = {
        white: "bg-white text-slate-800",
        blue: "text-white bg-gradient-to-br from-blue-600 to-blue-500",
        green: "text-white bg-gradient-to-br from-green-600 to-green-500",
        orange: "text-white bg-gradient-to-br from-orange-600 to-orange-500",
        red: "text-white bg-gradient-to-br from-red-600 to-red-500"
    };

    // Animated counter: menghitung naik dari nilai sebelumnya ke nilai baru.
    // PENTING: nilai awal ("start") dibaca lewat untrack() supaya efek ini
    // TIDAK ikut bergantung pada displayValue itu sendiri. Sebelumnya efek
    // membaca displayValue secara langsung, sehingga setiap kali animasi
    // menulis displayValue, efek ini terpicu ulang dan memunculkan loop
    // requestAnimationFrame baru yang bertumpuk dengan loop lama (yang
    // tidak pernah dibatalkan) - menyebabkan angka berubah liar/seolah
    // negatif, terutama pada nilai besar seperti Pendapatan Tahun Ini.
    let displayValue = $state(0);

    $effect(() => {

        const target = Number(value) || 0;
        const start = untrack(() => displayValue);
        const duration = 700;
        const startTime = performance.now();
        let rafId;

        function tick(now) {

            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            displayValue = Math.round(start + (target - start) * eased);

            if (progress < 1) {
                rafId = requestAnimationFrame(tick);
            } else {
                displayValue = target;
            }

        }

        rafId = requestAnimationFrame(tick);

        // Batalkan animasi yang masih berjalan setiap kali efek ini
        // dijalankan ulang (value berubah) atau komponen di-unmount,
        // supaya tidak ada dua loop animasi yang bertabrakan.
        return () => {
            if (rafId) cancelAnimationFrame(rafId);
        };

    });

    function formatDisplay(v) {
        if (format === "currency") {
            return "Rp" + Number(v).toLocaleString("id-ID");
        }
        return Number(v).toLocaleString("id-ID");
    }
</script>

<div
    class="card rounded-2xl p-6 shadow-md flex items-center justify-between {variants[variant] ?? variants.white}"
    style="animation-delay:{delay}ms"
>
    <div>
        <h3 class="text-sm {variant === 'white' ? 'text-slate-500' : 'opacity-90'}">
            {title}
        </h3>
        <p class="text-4xl font-bold mt-2 truncate">
            {formatDisplay(displayValue)}
        </p>
    </div>

    {#if icon}
        {@const Icon = icon}
        <div class="icon-wrap">
            <Icon size={40} />
        </div>
    {/if}
</div>

<style>
.card{
    opacity:0;
    animation: cardIn .5s ease forwards;
    transition: transform .25s ease, box-shadow .25s ease;
}

.card:hover{
    transform: translateY(-4px);
    box-shadow: 0 14px 28px rgba(0,0,0,.12);
}

.icon-wrap{
    animation: iconPop .5s ease .2s both;
}

@keyframes cardIn{
    from{
        opacity:0;
        transform: translateY(16px);
    }
    to{
        opacity:1;
        transform: translateY(0);
    }
}

@keyframes iconPop{
    from{
        opacity:0;
        transform: scale(.6) rotate(-8deg);
    }
    to{
        opacity:1;
        transform: scale(1) rotate(0deg);
    }
}
</style>

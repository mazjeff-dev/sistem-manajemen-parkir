<script>
    import { onMount, onDestroy } from "svelte";

    let now = $state(new Date());
    let interval;

    onMount(() => {
        interval = setInterval(() => {
            now = new Date();
        }, 1000);
    });

    onDestroy(() => {
        if (interval) clearInterval(interval);
    });

    let jam = $derived(
        now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        })
    );

    let tanggal = $derived(
        now.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        })
    );
</script>

<div class="clock-card rounded-2xl p-6 bg-white shadow-md flex flex-col items-center justify-center text-center">
    <p class="text-4xl font-bold text-slate-800 tabular-nums tracking-wide">{jam}</p>
    <p class="text-sm text-slate-500 mt-2">{tanggal}</p>
</div>

<style>
.clock-card{
    opacity:0;
    animation: clockIn .5s ease forwards;
    transition: transform .25s ease, box-shadow .25s ease;
}

.clock-card:hover{
    transform: translateY(-4px);
    box-shadow: 0 14px 28px rgba(0,0,0,.12);
}

@keyframes clockIn{
    from{
        opacity:0;
        transform: scale(.92);
    }
    to{
        opacity:1;
        transform: scale(1);
    }
}
</style>

<script>
    let {
        title = "",
        value = 0,
        icon = null,
        variant = "white",
        delay = 0
    } = $props();

    const variants = {
        white: "bg-white text-slate-800",
        blue: "text-white bg-gradient-to-br from-blue-600 to-blue-500",
        green: "text-white bg-gradient-to-br from-green-600 to-green-500",
        orange: "text-white bg-gradient-to-br from-orange-600 to-orange-500",
        red: "text-white bg-gradient-to-br from-red-600 to-red-500"
    };
</script>

<div
    class="card rounded-2xl p-6 shadow-md flex items-center justify-between {variants[variant] ?? variants.white}"
    style="animation-delay:{delay}ms"
>
    <div>
        <h3 class="text-sm {variant === 'white' ? 'text-slate-500' : 'opacity-90'}">
            {title}
        </h3>
        <p class="text-5xl font-bold mt-2">
            {value}
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

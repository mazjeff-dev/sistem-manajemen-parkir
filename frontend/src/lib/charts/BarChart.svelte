<script>
    let { title = "", data = [] } = $props();

    const width = 500;
    const height = 260;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };

    let chartW = width - padding.left - padding.right;
    let chartH = height - padding.top - padding.bottom;

    let maxVal = $derived(
        Math.max(1, ...data.map((d) => d.jumlah))
    );

    let barW = $derived(
        data.length ? (chartW / data.length) * 0.55 : 0
    );

    let gapW = $derived(
        data.length ? chartW / data.length : 0
    );

    function formatTanggal(tanggal) {
        if (!tanggal) return "-";
        const d = new Date(tanggal);
        return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    }

    let hoverIndex = $state(null);
</script>

<div class="bar-chart">
    {#if title}
        <h3 class="chart-title">{title}</h3>
    {/if}

    {#if !data.length}
        <p class="empty">Belum ada data</p>
    {:else}
        <svg viewBox="0 0 {width} {height}" class="chart-svg">

            <!-- garis bantu horizontal -->
            {#each [0, 0.25, 0.5, 0.75, 1] as g}
                <line
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={padding.top + chartH * (1 - g)}
                    y2={padding.top + chartH * (1 - g)}
                    class="grid-line"
                />
            {/each}

            {#each data as d, i}
                {@const barH = maxVal ? (d.jumlah / maxVal) * chartH : 0}
                {@const x = padding.left + i * gapW + (gapW - barW) / 2}
                {@const y = padding.top + chartH - barH}

                <g
                    onmouseenter={() => (hoverIndex = i)}
                    onmouseleave={() => (hoverIndex = null)}
                    role="img"
                    aria-label="{formatTanggal(d.tanggal)}: {d.jumlah}"
                >
                    <rect
                        x={x}
                        y={padding.top + chartH}
                        width={barW}
                        height={0}
                        rx="6"
                        class="bar"
                        class:bar-hover={hoverIndex === i}
                        style="animation-delay:{i * 80}ms; --bar-y:{y}; --bar-h:{barH};"
                    />

                    {#if hoverIndex === i}
                        <text
                            x={x + barW / 2}
                            y={y - 8}
                            text-anchor="middle"
                            class="value-label"
                        >
                            {d.jumlah}
                        </text>
                    {/if}

                    <text
                        x={x + barW / 2}
                        y={height - padding.bottom + 18}
                        text-anchor="middle"
                        class="axis-label"
                    >
                        {formatTanggal(d.tanggal)}
                    </text>
                </g>
            {/each}
        </svg>
    {/if}
</div>

<style>
.bar-chart{
    width:100%;
}

.chart-title{
    font-weight:600;
    color:#1e293b;
    margin-bottom:12px;
    font-size:15px;
}

.chart-svg{
    width:100%;
    height:auto;
    overflow:visible;
}

.grid-line{
    stroke:#eef1f6;
    stroke-width:1;
}

.axis-label{
    font-size:10px;
    fill:#94a3b8;
}

.value-label{
    font-size:11px;
    fill:#2563eb;
    font-weight:700;
    animation:fadeIn .2s ease;
}

.bar{
    fill:#3b82f6;
    transition:fill .2s ease;
    animation:growBar .6s cubic-bezier(.34,1.56,.64,1) forwards;
}

.bar-hover{
    fill:#1d4ed8;
}

@keyframes growBar{
    from{
        y:calc(var(--bar-y) + var(--bar-h));
        height:0;
    }
    to{
        y:var(--bar-y);
        height:var(--bar-h);
    }
}

@keyframes fadeIn{
    from{ opacity:0; transform:translateY(4px); }
    to{ opacity:1; transform:translateY(0); }
}

.empty{
    text-align:center;
    color:#94a3b8;
    padding:40px 0;
    font-size:14px;
}
</style>

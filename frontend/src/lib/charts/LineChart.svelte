<script>
    let { title = "", masuk = [], keluar = [] } = $props();

    const width = 700;
    const height = 260;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };

    let chartW = width - padding.left - padding.right;
    let chartH = height - padding.top - padding.bottom;

    let maxVal = $derived(
        Math.max(
            1,
            ...masuk.map((d) => d.jumlah),
            ...keluar.map((d) => d.jumlah)
        )
    );

    function pointsFor(arr) {
        if (!arr.length) return [];
        const step = arr.length > 1 ? chartW / (arr.length - 1) : 0;
        return arr.map((d, i) => ({
            x: padding.left + i * step,
            y: padding.top + chartH - (d.jumlah / maxVal) * chartH,
            jumlah: d.jumlah,
            tanggal: d.tanggal
        }));
    }

    let masukPoints = $derived(pointsFor(masuk));
    let keluarPoints = $derived(pointsFor(keluar));

    function toPath(points) {
        if (!points.length) return "";
        return points
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
            .join(" ");
    }

    function formatTanggal(tanggal) {
        if (!tanggal) return "-";
        const d = new Date(tanggal);
        return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    }
</script>

<div class="line-chart">
    {#if title}
        <h3 class="chart-title">{title}</h3>
    {/if}

    <div class="legend">
        <span class="legend-item"><i class="dot masuk"></i> Masuk</span>
        <span class="legend-item"><i class="dot keluar"></i> Keluar</span>
    </div>

    {#if !masuk.length && !keluar.length}
        <p class="empty">Belum ada data</p>
    {:else}
        <svg viewBox="0 0 {width} {height}" class="chart-svg">

            {#each [0, 0.25, 0.5, 0.75, 1] as g}
                <line
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={padding.top + chartH * (1 - g)}
                    y2={padding.top + chartH * (1 - g)}
                    class="grid-line"
                />
            {/each}

            <path d={toPath(masukPoints)} class="line masuk-line" />
            <path d={toPath(keluarPoints)} class="line keluar-line" />

            {#each masukPoints as p, i}
                <circle
                    cx={p.x} cy={p.y} r="4"
                    class="point masuk-point"
                    style="animation-delay:{300 + i * 60}ms"
                />
            {/each}

            {#each keluarPoints as p, i}
                <circle
                    cx={p.x} cy={p.y} r="4"
                    class="point keluar-point"
                    style="animation-delay:{300 + i * 60}ms"
                />
            {/each}

            {#each masukPoints as p, i}
                <text
                    x={p.x}
                    y={height - padding.bottom + 18}
                    text-anchor="middle"
                    class="axis-label"
                >
                    {formatTanggal(p.tanggal)}
                </text>
            {/each}
        </svg>
    {/if}
</div>

<style>
.line-chart{
    width:100%;
}

.chart-title{
    font-weight:600;
    color:#1e293b;
    margin-bottom:6px;
    font-size:15px;
}

.legend{
    display:flex;
    gap:16px;
    margin-bottom:10px;
}

.legend-item{
    display:flex;
    align-items:center;
    gap:6px;
    font-size:12px;
    color:#64748b;
}

.dot{
    width:9px;
    height:9px;
    border-radius:50%;
    display:inline-block;
}

.dot.masuk{ background:#2563eb; }
.dot.keluar{ background:#f97316; }

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

.line{
    fill:none;
    stroke-width:2.5;
    stroke-linecap:round;
    stroke-linejoin:round;
    stroke-dasharray:1400;
    stroke-dashoffset:1400;
    animation:drawLine 1.1s ease forwards;
}

.masuk-line{ stroke:#2563eb; }
.keluar-line{ stroke:#f97316; animation-delay:.15s; }

.point{
    opacity:0;
    transform-origin:center;
    animation:popPoint .3s ease forwards;
}

.masuk-point{ fill:#2563eb; }
.keluar-point{ fill:#f97316; }

@keyframes drawLine{
    to{ stroke-dashoffset:0; }
}

@keyframes popPoint{
    from{ opacity:0; r:0; }
    to{ opacity:1; }
}

.empty{
    text-align:center;
    color:#94a3b8;
    padding:40px 0;
    font-size:14px;
}
</style>

<script>
    let { title = "", data = [] } = $props();

    const size = 220;
    const radius = size / 2;
    const cx = radius;
    const cy = radius;

    const colors = [
        "#2563eb", "#f97316", "#16a34a", "#dc2626",
        "#9333ea", "#0891b2", "#ca8a04", "#db2777"
    ];

    let total = $derived(
        data.reduce((sum, d) => sum + Number(d.jumlah), 0)
    );

    function buildSlices(list, sum) {
        let currentAngle = -90;
        return list.map((d, i) => {
            const value = Number(d.jumlah);
            const percent = sum ? value / sum : 0;
            const angle = percent * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;

            const start = polarToCartesian(startAngle);
            const end = polarToCartesian(endAngle);
            const largeArc = angle > 180 ? 1 : 0;

            const path = [
                `M ${cx} ${cy}`,
                `L ${start.x} ${start.y}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
                "Z"
            ].join(" ");

            return {
                path,
                color: colors[i % colors.length],
                label: d.nama_jenis,
                value,
                percent
            };
        });
    }

    function polarToCartesian(angleDeg) {
        const angleRad = (angleDeg * Math.PI) / 180;
        return {
            x: cx + radius * Math.cos(angleRad),
            y: cy + radius * Math.sin(angleRad)
        };
    }

    let slices = $derived(buildSlices(data, total));

    let hoverIndex = $state(null);
</script>

<div class="pie-chart">
    {#if title}
        <h3 class="chart-title">{title}</h3>
    {/if}

    {#if !data.length || total === 0}
        <p class="empty">Belum ada data</p>
    {:else}
        <div class="pie-body">
            <svg viewBox="0 0 {size} {size}" class="chart-svg">
                {#each slices as slice, i}
                    <path
                        d={slice.path}
                        fill={slice.color}
                        class="slice"
                        class:slice-hover={hoverIndex === i}
                        style="animation-delay:{i * 100}ms"
                        onmouseenter={() => (hoverIndex = i)}
                        onmouseleave={() => (hoverIndex = null)}
                        role="img"
                        aria-label="{slice.label}: {slice.value}"
                    />
                {/each}
                <circle {cx} {cy} r={radius * 0.55} class="donut-hole" />
                <text x={cx} y={cy - 4} text-anchor="middle" class="total-value">
                    {total}
                </text>
                <text x={cx} y={cy + 14} text-anchor="middle" class="total-label">
                    Total
                </text>
            </svg>

            <div class="legend">
                {#each slices as slice, i}
                    <div
                        class="legend-item"
                        class:legend-hover={hoverIndex === i}
                        onmouseenter={() => (hoverIndex = i)}
                        onmouseleave={() => (hoverIndex = null)}
                        role="listitem"
                    >
                        <i class="dot" style="background:{slice.color}"></i>
                        <span class="legend-label">{slice.label}</span>
                        <span class="legend-value">
                            {slice.value} ({Math.round(slice.percent * 100)}%)
                        </span>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
.pie-chart{
    width:100%;
}

.chart-title{
    font-weight:600;
    color:#1e293b;
    margin-bottom:14px;
    font-size:15px;
}

.pie-body{
    display:flex;
    align-items:center;
    gap:24px;
    flex-wrap:wrap;
}

.chart-svg{
    width:180px;
    height:180px;
    flex-shrink:0;
    overflow:visible;
}

.slice{
    transform-origin:center;
    opacity:0;
    transform:scale(.85);
    animation:sliceIn .45s ease forwards;
    transition:filter .2s ease;
    cursor:pointer;
}

.slice-hover{
    filter:brightness(1.1);
}

@keyframes sliceIn{
    from{ opacity:0; transform:scale(.85); }
    to{ opacity:1; transform:scale(1); }
}

.donut-hole{
    fill:white;
}

.total-value{
    font-size:22px;
    font-weight:800;
    fill:#1e293b;
}

.total-label{
    font-size:10px;
    fill:#94a3b8;
}

.legend{
    display:flex;
    flex-direction:column;
    gap:8px;
    flex:1;
    min-width:160px;
}

.legend-item{
    display:flex;
    align-items:center;
    gap:8px;
    font-size:13px;
    color:#475569;
    padding:4px 6px;
    border-radius:8px;
    transition:background .2s ease;
    cursor:pointer;
}

.legend-hover{
    background:#f1f5f9;
}

.dot{
    width:10px;
    height:10px;
    border-radius:50%;
    flex-shrink:0;
}

.legend-label{
    flex:1;
}

.legend-value{
    font-weight:600;
    color:#1e293b;
}

.empty{
    text-align:center;
    color:#94a3b8;
    padding:40px 0;
    font-size:14px;
}
</style>

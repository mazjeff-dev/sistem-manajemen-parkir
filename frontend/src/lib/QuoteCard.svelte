<script>
    import { Sparkles } from "lucide-svelte";

    const daftarKata = [
        "Ketertiban parkir yang baik dimulai dari data yang rapi.",
        "Setiap kendaraan yang tercatat adalah satu langkah menuju sistem yang lebih tertata.",
        "Kerja rapi hari ini, laporan mudah di kemudian hari.",
        "Disiplin kecil dalam pencatatan, hasil besar dalam pengelolaan.",
        "Sistem yang baik bekerja diam-diam, tapi hasilnya terlihat jelas.",
        "Konsistensi adalah kunci dari pengelolaan parkir yang tertib."
    ];

    // Kata-kata dipilih acak setiap kali dashboard dibuka
    const kata = daftarKata[Math.floor(Math.random() * daftarKata.length)];
</script>

<div class="quote-card rounded-2xl p-6 bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/20 flex flex-col justify-center relative overflow-hidden">

    <Sparkles size={20} class="mb-3 text-blue-100"/>

    <p class="quote-text">
        “{kata}”
    </p>

</div>

<style>
.quote-card{
    opacity:0;
    animation: quoteIn .55s ease forwards;
    min-height: 96px;
    transition: transform .25s ease, box-shadow .25s ease;
}

.quote-card:hover{
    transform: translateY(-4px);
    box-shadow: 0 14px 28px rgba(0,0,0,.18);
}

.quote-text{
    font-family: Georgia, 'Times New Roman', serif;
    font-style: italic;
    font-size: 1.05rem;
    line-height: 1.5;
    letter-spacing: .01em;
}

@keyframes quoteIn{
    from{
        opacity:0;
        transform: translateY(14px);
    }
    to{
        opacity:1;
        transform: translateY(0);
    }
}
</style>

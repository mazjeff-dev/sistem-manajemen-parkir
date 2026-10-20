<script>
    // Kamera untuk mengisi form kendaraan: mengambil foto, backend
    // mengenali plat nomor + warna + jenis (POST /api/anpr/scan), lalu
    // hasilnya dikirim ke halaman lewat onhasil. Komponen ini TIDAK
    // menyimpan apa pun; petugas tetap memeriksa form lalu menekan Simpan.

    import { onMount, onDestroy } from "svelte";
    import { apiFetch } from "../services/api.js";

    let { onhasil, ontutup } = $props();

    let videoEl = $state(null);
    let stream = null;

    let kameraError = $state("");
    let kameraSiap = $state(false);
    let memindai = $state(false);
    let pesan = $state("");

    async function mulaiKamera() {

        kameraError = "";
        kameraSiap = false;

        if (!navigator.mediaDevices?.getUserMedia) {
            kameraError = "Browser ini tidak mendukung kamera, atau halaman tidak dibuka lewat HTTPS/localhost.";
            return;
        }

        try {

            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            videoEl.srcObject = stream;
            await videoEl.play();
            kameraSiap = true;

        } catch (err) {

            console.error("Kamera gagal:", err);
            kameraError = "Tidak bisa mengakses kamera. Pastikan izin kamera diaktifkan di browser dan kamera tidak dipakai aplikasi lain.";

        }

    }

    function hentikanKamera() {
        if (stream) {
            stream.getTracks().forEach((t) => t.stop());
            stream = null;
        }
    }

    // Foto dikecilkan dulu (maks 1280px) supaya upload cepat.
    function ambilFoto() {

        const lebar = videoEl.videoWidth;
        const tinggi = videoEl.videoHeight;
        const skala = Math.min(1, 1280 / Math.max(lebar, tinggi));

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(lebar * skala);
        canvas.height = Math.round(tinggi * skala);
        canvas.getContext("2d").drawImage(videoEl, 0, 0, canvas.width, canvas.height);

        return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));

    }

    async function kenali() {

        if (!kameraSiap || memindai) return;

        memindai = true;
        pesan = "";

        try {

            const blob = await ambilFoto();

            if (!blob) {
                pesan = "Gagal mengambil foto dari kamera";
                return;
            }

            const form = new FormData();
            form.append("foto", blob, "kendaraan.jpg");

            const res = await apiFetch("/anpr/scan", { method: "POST", body: form });

            if (!res) return;

            const data = await res.json();

            if (!res.ok) {
                pesan = data.message || "Gagal mengenali kendaraan";
                return;
            }

            if (!data.plat_nomor && !data.warna) {
                pesan = "Kendaraan tidak terbaca. Arahkan kamera lebih dekat lalu ulangi.";
                return;
            }

            hentikanKamera();
            onhasil?.(data);

        } catch (err) {

            console.error(err);
            pesan = "Terjadi kesalahan saat memproses foto";

        } finally {
            memindai = false;
        }

    }

    function tutup() {
        hentikanKamera();
        ontutup?.();
    }

    onMount(mulaiKamera);
    onDestroy(hentikanKamera);
</script>

<div class="overlay">
    <div class="kartu">

        <h2>Foto Kendaraan</h2>

        <div class="layar">
            <!-- svelte-ignore a11y_media_has_caption -->
            <video bind:this={videoEl} playsinline muted></video>
            {#if !kameraSiap && !kameraError}
                <p class="overlay-teks">Menyalakan kamera...</p>
            {/if}
            {#if memindai}
                <p class="overlay-teks">Mengenali plat & warna...</p>
            {/if}
        </div>

        {#if kameraError}
            <p class="pesan">{kameraError}</p>
        {:else if pesan}
            <p class="pesan">{pesan}</p>
        {:else}
            <p class="petunjuk">Arahkan kamera sampai plat dan bodi kendaraan terlihat jelas.</p>
        {/if}

        <div class="aksi">
            <button class="batal" onclick={tutup}>Batal</button>
            {#if kameraError}
                <button class="utama" onclick={mulaiKamera}>Coba Lagi</button>
            {:else}
                <button class="utama" onclick={kenali} disabled={!kameraSiap || memindai}>
                    {memindai ? "Memproses..." : "Ambil & Kenali"}
                </button>
            {/if}
        </div>

    </div>
</div>

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, .55);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 60;
        padding: 12px;
        overflow-y: auto;
    }

    .kartu {
        width: 480px;
        max-width: 100%;
        background: white;
        border-radius: 16px;
        padding: 22px;
    }

    h2 { margin: 0 0 14px; font-size: 20px; }

    .layar {
        position: relative;
        width: 100%;
        aspect-ratio: 4 / 3;
        background: #0f172a;
        border-radius: 12px;
        overflow: hidden;
    }

    video { width: 100%; height: 100%; object-fit: cover; display: block; }

    .overlay-teks {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        color: white;
        background: rgba(15, 23, 42, .55);
        font-size: 15px;
    }

    .petunjuk { margin: 10px 0 0; font-size: 13px; color: #64748b; }

    .pesan {
        margin: 10px 0 0;
        padding: 9px 12px;
        border-radius: 10px;
        font-size: 13px;
        background: #fef2f2;
        color: #b91c1c;
    }

    .aksi { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }

    button { border: 0; border-radius: 10px; padding: 11px 16px; color: white; cursor: pointer; font-size: 14px; }
    button:disabled { opacity: .5; cursor: not-allowed; }
    .utama { background: #16a34a; }
    .batal { background: #64748b; }
</style>

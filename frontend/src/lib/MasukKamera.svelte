<script>
    // Modal "Masuk via Kamera": kamera mengambil foto kendaraan, backend
    // mengenali plat nomor + warna + jenis, petugas cukup memeriksa hasilnya
    // lalu menekan simpan. Kendaraan yang belum terdaftar otomatis
    // didaftarkan, jadi tidak ada yang perlu dicatat manual.

    import { onMount, onDestroy } from "svelte";
    import { apiFetch } from "../services/api.js";

    let { onselesai, ontutup } = $props();

    const WARNA = [
        "Hitam", "Putih", "Silver", "Abu-abu", "Merah", "Biru", "Hijau",
        "Kuning", "Oranye", "Coklat", "Ungu", "Pink", "Emas", "Lainnya"
    ];

    // Kata kunci nama jenis kendaraan di database untuk tiap jenis
    // hasil deteksi kamera.
    const PETA_JENIS = {
        motor: ["motor", "sepeda"],
        mobil: ["mobil", "minibus", "sedan", "suv", "pickup"],
        truk: ["truk", "truck", "pickup"],
        bus: ["bus"]
    };

    let videoEl = $state(null);
    let stream = null;

    let kameraError = $state("");
    let kameraSiap = $state(false);

    let fase = $state("kamera"); // "kamera" | "hasil"
    let fotoUrl = $state("");
    let memindai = $state(false);
    let menyimpan = $state(false);

    let jenisList = $state([]);

    let plat = $state("");
    let warna = $state("");
    let jenisId = $state("");
    let namaPemilik = $state("");
    let terdaftar = $state(null);
    let sedangParkir = $state(false);
    let keyakinan = $state(null);
    let pesan = $state("");
    let pesanError = $state(false);

    let bisaSimpan = $derived(
        plat.trim() !== "" && warna.trim() !== "" && jenisId !== "" && !sedangParkir && !menyimpan
    );

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

    async function loadJenis() {
        try {
            const res = await apiFetch("/jenis");
            if (!res) return;
            const data = await res.json();
            if (res.ok && Array.isArray(data)) jenisList = data;
        } catch (err) {
            console.error(err);
        }
    }

    function cariJenisId(hint) {

        const kata = PETA_JENIS[hint] || [];

        for (const k of kata) {
            const ketemu = jenisList.find((j) => String(j.nama_jenis).toLowerCase().includes(k));
            if (ketemu) return String(ketemu.id);
        }

        return "";

    }

    // Foto dikecilkan dulu (maks 1280px) supaya upload cepat.
    function ambilFoto() {

        const lebarAsli = videoEl.videoWidth;
        const tinggiAsli = videoEl.videoHeight;
        const skala = Math.min(1, 1280 / Math.max(lebarAsli, tinggiAsli));

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(lebarAsli * skala);
        canvas.height = Math.round(tinggiAsli * skala);
        canvas.getContext("2d").drawImage(videoEl, 0, 0, canvas.width, canvas.height);

        return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));

    }

    async function kenali() {

        if (!kameraSiap || memindai) return;

        memindai = true;
        pesan = "";
        pesanError = false;

        try {

            const blob = await ambilFoto();

            if (!blob) {
                pesan = "Gagal mengambil foto dari kamera";
                pesanError = true;
                return;
            }

            if (fotoUrl) URL.revokeObjectURL(fotoUrl);
            fotoUrl = URL.createObjectURL(blob);

            const form = new FormData();
            form.append("foto", blob, "kendaraan.jpg");

            const res = await apiFetch("/anpr/scan", { method: "POST", body: form });

            if (!res) return;

            const data = await res.json();

            fase = "hasil";

            if (!res.ok) {
                // Scan gagal: tetap tampilkan form kosong supaya petugas bisa isi manual.
                plat = "";
                warna = "";
                jenisId = "";
                namaPemilik = "";
                terdaftar = null;
                sedangParkir = false;
                keyakinan = null;
                pesan = `${data.message || "Gagal mengenali kendaraan"}. Isi data secara manual.`;
                pesanError = true;
                return;
            }

            plat = data.plat_nomor || "";
            warna = data.kendaraan?.warna || data.warna || "";
            jenisId = data.kendaraan ? String(data.kendaraan.jenis_id) : cariJenisId(data.jenis);
            namaPemilik = "";
            terdaftar = data.kendaraan;
            sedangParkir = data.sedang_parkir;
            keyakinan = data.keyakinan;

            if (sedangParkir) {
                pesan = "Kendaraan ini masih tercatat parkir. Proses dulu kendaraan keluar.";
                pesanError = true;
            } else if (!data.plat_nomor) {
                pesan = data.plat_mentah
                    ? `Plat terbaca "${data.plat_mentah}" tapi bentuknya tidak valid. Periksa dan isi manual.`
                    : "Plat tidak terbaca. Arahkan kamera ke plat lalu ulangi, atau isi manual.";
                pesanError = true;
            } else if (data.keyakinan < 0.7) {
                pesan = "Keyakinan rendah, periksa plat dengan teliti sebelum menyimpan.";
                pesanError = true;
            } else {
                pesan = data.catatan || "";
                pesanError = false;
            }

        } catch (err) {

            console.error(err);
            pesan = "Terjadi kesalahan saat memproses foto";
            pesanError = true;

        } finally {
            memindai = false;
        }

    }

    function ulangi() {
        fase = "kamera";
        pesan = "";
        pesanError = false;
        if (!stream) mulaiKamera();
    }

    async function simpan() {

        if (!bisaSimpan) return;

        menyimpan = true;
        pesan = "";

        try {

            const res = await apiFetch("/parkir/masuk-kamera", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plat_nomor: plat,
                    warna,
                    jenis_id: jenisId,
                    nama_pemilik: namaPemilik
                })
            });

            if (!res) return;

            const data = await res.json();

            if (!res.ok) {
                pesan = data.message || "Gagal mencatat kendaraan masuk";
                pesanError = true;
                return;
            }

            hentikanKamera();
            onselesai?.(data.kode_tiket);

        } catch (err) {

            console.error(err);
            pesan = "Terjadi kesalahan";
            pesanError = true;

        } finally {
            menyimpan = false;
        }

    }

    function tutup() {
        hentikanKamera();
        ontutup?.();
    }

    onMount(() => {
        loadJenis();
        mulaiKamera();
    });

    onDestroy(() => {
        hentikanKamera();
        if (fotoUrl) URL.revokeObjectURL(fotoUrl);
    });
</script>

<div class="overlay">
    <div class="kartu">

        <h2>Kendaraan Masuk via Kamera</h2>

        <div class="layar">
            <!-- svelte-ignore a11y_media_has_caption -->
            <video bind:this={videoEl} playsinline muted class:sembunyi={fase !== "kamera"}></video>
            {#if fase === "hasil" && fotoUrl}
                <img src={fotoUrl} alt="Foto kendaraan" />
            {/if}
            {#if fase === "kamera" && !kameraSiap && !kameraError}
                <p class="overlay-teks">Menyalakan kamera...</p>
            {/if}
            {#if memindai}
                <p class="overlay-teks">Mengenali plat & warna...</p>
            {/if}
        </div>

        {#if kameraError && fase === "kamera"}
            <p class="pesan error">{kameraError}</p>
        {/if}

        {#if fase === "kamera"}

            <p class="petunjuk">Arahkan kamera ke kendaraan sampai plat terlihat jelas, lalu ambil foto.</p>

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

        {:else}

            {#if pesan}
                <p class="pesan" class:error={pesanError}>{pesan}</p>
            {/if}

            {#if terdaftar}
                <p class="pesan info">Terdaftar atas nama <b>{terdaftar.nama_pemilik}</b></p>
            {:else if plat && !sedangParkir}
                <p class="pesan info">Plat baru, akan didaftarkan otomatis.</p>
            {/if}

            <label for="mk-plat">Plat nomor{#if keyakinan !== null} <small>(keyakinan {Math.round(keyakinan * 100)}%)</small>{/if}</label>
            <input id="mk-plat" type="text" bind:value={plat} placeholder="B 1234 XYZ" oninput={() => plat = plat.toUpperCase()} />

            <div class="dua">
                <div>
                    <label for="mk-warna">Warna</label>
                    <input id="mk-warna" type="text" list="mk-daftar-warna" bind:value={warna} />
                    <datalist id="mk-daftar-warna">
                        {#each WARNA as w}<option value={w}></option>{/each}
                    </datalist>
                </div>
                <div>
                    <label for="mk-jenis">Jenis</label>
                    <select id="mk-jenis" bind:value={jenisId} disabled={!!terdaftar}>
                        <option value="" disabled>Pilih jenis</option>
                        {#each jenisList as j}
                            <option value={String(j.id)}>{j.nama_jenis}</option>
                        {/each}
                    </select>
                </div>
            </div>

            {#if !terdaftar}
                <label for="mk-nama">Nama pemilik <small>(opsional, default "Tamu")</small></label>
                <input id="mk-nama" type="text" bind:value={namaPemilik} placeholder="Tamu" />
            {/if}

            <div class="aksi">
                <button class="batal" onclick={tutup}>Batal</button>
                <button class="sekunder" onclick={ulangi}>Foto Ulang</button>
                <button class="utama" onclick={simpan} disabled={!bisaSimpan}>
                    {menyimpan ? "Menyimpan..." : "Simpan & Cetak Tiket"}
                </button>
            </div>

        {/if}

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

    .layar video, .layar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .layar video.sembunyi { display: none; }

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
        margin: 12px 0 0;
        padding: 9px 12px;
        border-radius: 10px;
        font-size: 13px;
        background: #f1f5f9;
        color: #334155;
    }
    .pesan.error { background: #fef2f2; color: #b91c1c; }
    .pesan.info { background: #eff6ff; color: #1d4ed8; }

    label { display: block; margin: 12px 0 4px; font-size: 13px; font-weight: 600; color: #475569; }
    label small { font-weight: 400; color: #94a3b8; }

    input, select {
        width: 100%;
        padding: 11px 12px;
        border: 1px solid #ddd;
        border-radius: 10px;
        font-size: 15px;
        box-sizing: border-box;
    }

    #mk-plat { font-weight: 700; letter-spacing: 1px; font-size: 18px; }

    .dua { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

    .aksi { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; flex-wrap: wrap; }

    button { border: 0; border-radius: 10px; padding: 11px 16px; color: white; cursor: pointer; font-size: 14px; }
    button:disabled { opacity: .5; cursor: not-allowed; }
    .utama { background: #16a34a; }
    .sekunder { background: #0f172a; }
    .batal { background: #64748b; }
</style>

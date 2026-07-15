<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import BASE_URL, { SERVER_URL } from "../../services/api.js";
    import { logout } from "../../stores/auth.js";
    import { profileInfo } from "../../stores/profile.js";
    import { UserCircle2, Camera, Save, KeyRound, Loader2 } from "lucide-svelte";

    let profile = $state({
        id: null,
        nama: "",
        email: "",
        foto: null,
        created_at: null
    });

    let namaForm = $state("");
    let emailForm = $state("");

    let passwordLama = $state("");
    let passwordBaru = $state("");
    let konfirmasiPassword = $state("");

    let fileInput = $state(null);
    let previewFoto = $state(null);
    let fileTerpilih = $state(null);

    let loadingProfile = $state(true);
    let savingProfile = $state(false);
    let savingPassword = $state(false);
    let uploadingFoto = $state(false);

    let toast = $state({ show: false, message: "", type: "success" });

    function showToast(message, type = "success") {
        toast = { show: true, message, type };
        setTimeout(() => {
            toast = { ...toast, show: false };
        }, 3000);
    }

    function handleUnauthorized() {
        logout();
        showToast("Sesi berakhir, silakan login kembali", "error");
        goto("/");
    }

    function formatTanggal(tanggal) {
        if (!tanggal) return "-";
        return new Date(tanggal).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    async function loadProfile() {
        loadingProfile = true;

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                handleUnauthorized();
                return;
            }

            const response = await fetch(`${BASE_URL}/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            const data = await response.json();

            profile = data;
            namaForm = data.nama;
            emailForm = data.email;

            profileInfo.set({
                nama: data.nama || "Administrator",
                foto: data.foto || null
            });

        } catch (err) {
            console.error(err);
            showToast("Gagal mengambil data profil", "error");
        } finally {
            loadingProfile = false;
        }
    }

    async function simpanProfile() {
        if (!namaForm || !emailForm) {
            showToast("Nama dan email wajib diisi", "error");
            return;
        }

        savingProfile = true;

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${BASE_URL}/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ nama: namaForm, email: emailForm })
            });

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                showToast(data.message, "error");
                return;
            }

            showToast(data.message);
            await loadProfile();

        } catch (err) {
            console.error(err);
            showToast("Terjadi kesalahan", "error");
        } finally {
            savingProfile = false;
        }
    }

    async function gantiPassword() {
        if (!passwordLama || !passwordBaru || !konfirmasiPassword) {
            showToast("Semua field password wajib diisi", "error");
            return;
        }

        if (passwordBaru !== konfirmasiPassword) {
            showToast("Konfirmasi password tidak cocok", "error");
            return;
        }

        savingPassword = true;

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${BASE_URL}/profile/password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    password_lama: passwordLama,
                    password_baru: passwordBaru
                })
            });

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                showToast(data.message, "error");
                return;
            }

            showToast(data.message);
            passwordLama = "";
            passwordBaru = "";
            konfirmasiPassword = "";

        } catch (err) {
            console.error(err);
            showToast("Terjadi kesalahan", "error");
        } finally {
            savingPassword = false;
        }
    }

    function pilihFoto(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        fileTerpilih = file;
        previewFoto = URL.createObjectURL(file);
    }

    async function unggahFoto() {
        if (!fileTerpilih) {
            fileInput?.click();
            return;
        }

        uploadingFoto = true;

        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("foto", fileTerpilih);

            const response = await fetch(`${BASE_URL}/profile/foto`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                showToast(data.message, "error");
                return;
            }

            showToast(data.message);
            fileTerpilih = null;
            previewFoto = null;
            await loadProfile();

        } catch (err) {
            console.error(err);
            showToast("Gagal mengunggah foto", "error");
        } finally {
            uploadingFoto = false;
        }
    }

    onMount(() => {
        loadProfile();
    });
</script>

<div class="p-8 flex flex-col gap-6 profile-page">

    <div class="header-in">
        <h1 class="text-3xl font-bold text-slate-800">Profil Saya</h1>
        <p class="text-slate-500 mt-1">Kelola informasi akun dan keamanan login kamu</p>
    </div>

            {#if loadingProfile}
                <div class="flex items-center gap-2 text-slate-500">
                    <Loader2 class="animate-spin" size={20} />
                    Memuat profil...
                </div>
            {:else}

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <!-- Kolom kiri: Foto + Informasi Akun -->
                    <div class="flex flex-col gap-6 col-in" style="animation-delay:80ms">

                        <div class="rounded-2xl p-6 bg-white shadow-md flex flex-col items-center text-center avatar-card">

                            <div class="relative">
                                {#if previewFoto}
                                    <img
                                        src={previewFoto}
                                        alt="Preview foto"
                                        class="w-28 h-28 rounded-full object-cover border-4 border-blue-100"
                                    />
                                {:else if profile.foto}
                                    <img
                                        src={`${SERVER_URL}/uploads/profile/${profile.foto}`}
                                        alt="Foto profil"
                                        class="w-28 h-28 rounded-full object-cover border-4 border-blue-100"
                                    />
                                {:else}
                                    <UserCircle2 size={112} class="text-blue-500" />
                                {/if}

                                <button
                                    onclick={() => fileInput?.click()}
                                    title="Ganti foto"
                                    class="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-md transition"
                                >
                                    <Camera size={16} />
                                </button>

                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    bind:this={fileInput}
                                    onchange={pilihFoto}
                                    class="hidden"
                                />
                            </div>

                            <h2 class="text-xl font-bold text-slate-800 mt-4">{profile.nama}</h2>
                            <p class="text-slate-500 text-sm">{profile.email}</p>

                            {#if fileTerpilih}
                                <button
                                    onclick={unggahFoto}
                                    disabled={uploadingFoto}
                                    class="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2 transition"
                                >
                                    {#if uploadingFoto}
                                        <Loader2 class="animate-spin" size={16} />
                                    {/if}
                                    Simpan Foto Baru
                                </button>
                            {/if}

                        </div>

                        <div class="rounded-2xl p-6 bg-white shadow-md">
                            <h3 class="text-slate-800 font-semibold mb-4">Informasi Akun</h3>

                            <div class="flex flex-col gap-3 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-slate-500">Nama</span>
                                    <span class="font-medium text-slate-700">{profile.nama}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-slate-500">Email</span>
                                    <span class="font-medium text-slate-700">{profile.email}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-slate-500">Bergabung Sejak</span>
                                    <span class="font-medium text-slate-700">
                                        {formatTanggal(profile.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Kolom kanan: Edit Profile + Ganti Password -->
                    <div class="lg:col-span-2 flex flex-col gap-6 col-in" style="animation-delay:160ms">

                        <div class="rounded-2xl p-6 bg-white shadow-md">
                            <h3 class="text-slate-800 font-semibold text-lg mb-4">Edit Profile</h3>

                            <div class="flex flex-col gap-4">
                                <div>
                                    <label for="nama" class="text-sm text-slate-600 mb-1 block">Nama</label>
                                    <input
                                        id="nama"
                                        type="text"
                                        bind:value={namaForm}
                                        class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label for="email" class="text-sm text-slate-600 mb-1 block">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        bind:value={emailForm}
                                        class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <button
                                    onclick={simpanProfile}
                                    disabled={savingProfile}
                                    class="self-start bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg px-5 py-2 text-sm font-semibold flex items-center gap-2 transition"
                                >
                                    {#if savingProfile}
                                        <Loader2 class="animate-spin" size={16} />
                                    {:else}
                                        <Save size={16} />
                                    {/if}
                                    Simpan Perubahan
                                </button>
                            </div>
                        </div>

                        <div class="rounded-2xl p-6 bg-white shadow-md">
                            <h3 class="text-slate-800 font-semibold text-lg mb-4">Ganti Password</h3>

                            <div class="flex flex-col gap-4">
                                <div>
                                    <label for="password-lama" class="text-sm text-slate-600 mb-1 block">Password Lama</label>
                                    <input
                                        id="password-lama"
                                        type="password"
                                        bind:value={passwordLama}
                                        class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label for="password-baru" class="text-sm text-slate-600 mb-1 block">Password Baru</label>
                                    <input
                                        id="password-baru"
                                        type="password"
                                        bind:value={passwordBaru}
                                        class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label for="konfirmasi-password" class="text-sm text-slate-600 mb-1 block">Konfirmasi Password Baru</label>
                                    <input
                                        id="konfirmasi-password"
                                        type="password"
                                        bind:value={konfirmasiPassword}
                                        class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <button
                                    onclick={gantiPassword}
                                    disabled={savingPassword}
                                    class="self-start bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white rounded-lg px-5 py-2 text-sm font-semibold flex items-center gap-2 transition"
                                >
                                    {#if savingPassword}
                                        <Loader2 class="animate-spin" size={16} />
                                    {:else}
                                        <KeyRound size={16} />
                                    {/if}
                                    Ubah Password
                                </button>
                            </div>
                        </div>

                    </div>

                </div>

            {/if}

</div>

{#if toast.show}
    <div
        class="fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium z-50"
        class:bg-green-600={toast.type === "success"}
        class:bg-red-600={toast.type === "error"}
    >
        {toast.message}
    </div>
{/if}

<style>
.header-in{
    opacity:0;
    animation: profileFadeDown .5s ease forwards;
}

.avatar-card{
    transition: transform .25s ease, box-shadow .25s ease;
}

.avatar-card:hover{
    transform: translateY(-4px);
    box-shadow: 0 14px 28px rgba(0,0,0,.1);
}

.col-in{
    opacity:0;
    animation: profileFadeUp .5s ease forwards;
}

@keyframes profileFadeDown{
    from{
        opacity:0;
        transform: translateY(-14px);
    }
    to{
        opacity:1;
        transform: translateY(0);
    }
}

@keyframes profileFadeUp{
    from{
        opacity:0;
        transform: translateY(16px);
    }
    to{
        opacity:1;
        transform: translateY(0);
    }
}
</style>

<script>
    import BASE_URL from "../../services/api.js";
    import { goto } from "$app/navigation";

    import Mail from "lucide-svelte/icons/mail";
    import Lock from "lucide-svelte/icons/lock";
    import User from "lucide-svelte/icons/user";
    import LoaderCircle from "lucide-svelte/icons/loader-circle";
    import SquareParking from "lucide-svelte/icons/square-parking";

    let nama = $state("");
    let email = $state("");
    let password = $state("");
    let konfirmasiPassword = $state("");
    let error = $state("");
    let success = $state("");
    let loading = $state(false);

    function handleSubmit(event) {
        event.preventDefault();
        register();
    }

    async function register() {

        error = "";
        success = "";

        if (password !== konfirmasiPassword) {
            error = "Konfirmasi password tidak sama";
            return;
        }

        if (password.length < 6) {
            error = "Password minimal 6 karakter";
            return;
        }

        loading = true;

        try {

            const response = await fetch(`${BASE_URL}/auth/register`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    nama,
                    email,
                    password
                })

            });

            const data = await response.json();

            if (!response.ok) {
                error = data.message;
                loading = false;
                return;
            }

            success = "Registrasi berhasil! Mengarahkan ke halaman login...";

            setTimeout(() => {
                goto("/");
            }, 1200);

        } catch (err) {

            error = err.message;

        }

        loading = false;

    }
</script>

<div class="login-page">

    <div class="content-wrapper">

        <div class="login-card">

            <div class="logo">
                <SquareParking size={38} strokeWidth={2.2}/>
            </div>

            <h1>Buat Akun</h1>

            <p class="subtitle">
                Daftar untuk mengakses Sistem Manajemen Parkir
            </p>

            <p class="role-note">
                Catatan: akun pertama yang mendaftar di sistem otomatis menjadi <b>Admin</b>. Akun berikutnya otomatis menjadi <b>Petugas</b>.
            </p>

            <form onsubmit={handleSubmit}>

                <div class="input-group">
                    <label for="nama">Nama</label>
                    <div class="input-box">
                        <User size={18}/>
                        <input
                            id="nama"
                            type="text"
                            bind:value={nama}
                            placeholder="Masukkan nama lengkap"
                            required
                        />
                    </div>
                </div>

                <div class="input-group">
                    <label for="email">Email</label>
                    <div class="input-box">
                        <Mail size={18}/>
                        <input
                            id="email"
                            type="email"
                            bind:value={email}
                            placeholder="Masukkan email"
                            required
                        />
                    </div>
                </div>

                <div class="input-group">
                    <label for="password">Password</label>
                    <div class="input-box">
                        <Lock size={18}/>
                        <input
                            id="password"
                            type="password"
                            bind:value={password}
                            placeholder="Minimal 6 karakter"
                            required
                        />
                    </div>
                </div>

                <div class="input-group">
                    <label for="konfirmasi">Konfirmasi Password</label>
                    <div class="input-box">
                        <Lock size={18}/>
                        <input
                            id="konfirmasi"
                            type="password"
                            bind:value={konfirmasiPassword}
                            placeholder="Ulangi password"
                            required
                        />
                    </div>
                </div>

                {#if error}
                    <div class="error">
                        {error}
                    </div>
                {/if}

                {#if success}
                    <div class="success">
                        {success}
                    </div>
                {/if}

                <button type="submit" disabled={loading} class="submit-btn">

                    {#if loading}
                        <span class="spin">
                            <LoaderCircle size={18} />
                        </span>
                        Mendaftar...
                    {:else}
                        Daftar
                    {/if}

                </button>

            </form>

            <p class="register-link">
                Sudah punya akun? <a href="/">Login di sini</a>
            </p>

            <p class="footer">
                Sistem Manajemen Parkir, project klompok 14
            </p>

        </div>

    </div>

</div>

<style>

.login-page{
    min-height:100vh;
    display:flex;
    justify-content:center;
    align-items:center;
    background:linear-gradient(135deg,#0f172a,#2563eb);
    position:relative;
    overflow:hidden;
    padding:20px;
}

.login-page::before{
    content:"";
    position:absolute;
    width:500px;
    height:500px;
    background:rgba(255,255,255,.08);
    border-radius:50%;
    top:-180px;
    left:-180px;
    filter:blur(20px);
}

.login-page::after{
    content:"";
    position:absolute;
    width:450px;
    height:450px;
    background:rgba(255,255,255,.05);
    border-radius:50%;
    bottom:-180px;
    right:-180px;
    filter:blur(20px);
}

.content-wrapper{
    display:flex;
    align-items:stretch;
    justify-content:center;
    position:relative;
    z-index:2;
    width:100%;
    max-width:1500px;
}

.login-card{
    width:440px;
    flex-shrink:0;
    margin:0 auto;
    background:rgba(255,255,255,.97);
    backdrop-filter:blur(10px);
    padding:44px;
    border-radius:22px;
    box-shadow:0 20px 40px rgba(0,0,0,.25);
    position:relative;
    animation:slideFade .8s ease;
    display:flex;
    flex-direction:column;
    justify-content:center;
}

.logo{
    width:80px;
    height:80px;
    margin:0 auto;
    border-radius:50%;
    background:linear-gradient(135deg, #2563eb, #1d4ed8);
    color:white;
    display:flex;
    align-items:center;
    justify-content:center;
    box-shadow:0 8px 20px rgba(37,99,235,.35);
}

h1{
    text-align:center;
    margin-top:22px;
    color:#0f172a;
    font-size:28px;
    font-weight:800;
    letter-spacing:-.02em;
}

.subtitle{
    text-align:center;
    color:#64748b;
    margin-top:8px;
    margin-bottom:14px;
}

.role-note{
    text-align:center;
    color:#2563eb;
    background:#eff6ff;
    border-radius:10px;
    padding:10px 12px;
    font-size:12.5px;
    margin-bottom:22px;
}

.input-group{
    margin-bottom:20px;
}

label{
    display:block;
    margin-bottom:8px;
    font-weight:600;
    color:#334155;
}

.input-box{
    display:flex;
    align-items:center;
    gap:10px;
    background:#f8fafc;
    border:1px solid #dbe3ef;
    border-radius:12px;
    padding:0 12px;
    transition:.3s;
}

.input-box:focus-within{
    border-color:#2563eb;
    box-shadow:0 0 0 4px rgba(37,99,235,.15);
}

.input-box input{
    flex:1;
    border:none;
    background:transparent;
    outline:none;
    padding:14px 0;
    font-size:15px;
}

.submit-btn{
    width:100%;
    margin-top:10px;
    padding:14px;
    border:none;
    border-radius:12px;
    background:linear-gradient(135deg,#2563eb,#1d4ed8);
    color:white;
    font-size:16px;
    font-weight:bold;
    cursor:pointer;
    display:flex;
    justify-content:center;
    align-items:center;
    gap:8px;
    transition:.3s;
}

.submit-btn:hover{
    transform:translateY(-2px);
    box-shadow:0 10px 20px rgba(37,99,235,.35);
}

.submit-btn:disabled{
    opacity:.7;
    cursor:not-allowed;
}

.error{
    background:#fee2e2;
    color:#dc2626;
    padding:12px;
    border-radius:10px;
    margin-top:10px;
    margin-bottom:5px;
    text-align:center;
    font-size:14px;
}

.success{
    background:#dcfce7;
    color:#16a34a;
    padding:12px;
    border-radius:10px;
    margin-top:10px;
    margin-bottom:5px;
    text-align:center;
    font-size:14px;
}

.register-link{
    text-align:center;
    margin-top:18px;
    color:#64748b;
    font-size:14px;
}

.register-link a{
    color:#2563eb;
    font-weight:600;
    text-decoration:none;
}

.register-link a:hover{
    text-decoration:underline;
}

.footer{
    text-align:center;
    margin-top:30px;
    color:#94a3b8;
    font-size:14px;
}

.spin{
    animation:spin 1s linear infinite;
}

@keyframes spin{
    from{ transform:rotate(0deg); }
    to{ transform:rotate(360deg); }
}

@keyframes slideFade{
    from{ opacity:0; transform:translateY(40px); }
    to{ opacity:1; transform:translateY(0); }
}

</style>

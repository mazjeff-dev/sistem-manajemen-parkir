<script>
    import BASE_URL from "../services/api.js";
    import { saveToken } from "../stores/auth.js";
    import { goto } from "$app/navigation";

    import { Mail, Lock, LoaderCircle, SquareParking, X } from "lucide-svelte";

    let email = $state("");
    let password = $state("");
    let error = $state("");
    let loading = $state(false);
    let showTutorial = $state(false);

    function toggleTutorial() {
        showTutorial = !showTutorial;
    }

    function handleSubmit(event) {
                event.preventDefault();
                login();
    }

    async function login() {

        error = "";
        loading = true;

        try {

            const response = await fetch(`${BASE_URL}/auth/login`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
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

            saveToken(data.token);

            goto("/dashboard");

        } catch (err) {

            error = err.message;

        }

        loading = false;

    }
</script>

<div class="login-page">

    <div class="content-wrapper">

        <div class="login-card">

            <button
                type="button"
                class="logo"
                onclick={toggleTutorial}
                aria-label="Tampilkan tutorial"
            >
                <SquareParking size={38} strokeWidth={2.2}/>
            </button>

            <h1>Sistem Parkir</h1>

            <p class="subtitle">
                pencet logo dan lihat tutorial
            </p>

            <form onsubmit={handleSubmit}>
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
                            placeholder="Masukkan password"
                            required
                        />

                    </div>

                </div>

                {#if error}

                    <div class="error">

                        {error}

                    </div>

                {/if}

                <button type="submit" disabled={loading} class="submit-btn">

                    {#if loading}

                        <span class="spin">
                            <LoaderCircle size={18} />
                        </span>
                        Login...

                    {:else}

                        Login

                    {/if}

                </button>

            </form>

            <p class="footer">

                © 2026 Sistem Manajemen Parkir

            </p>

        </div>

        <div class="tutorial-panel" class:open={showTutorial} aria-hidden={!showTutorial}>
            <div class="tutorial-inner">

                <button class="close-btn" onclick={toggleTutorial} aria-label="Tutup tutorial" tabindex={showTutorial ? 0 : -1}>
                    <X size={18} />
                </button>

                <h2>Cara Menggunakan Sistem Parkir</h2>

                <ol>
                    <li>
                        Masukkan <strong>email</strong> dan <strong>password</strong> administrator pada form login.
                    </li>
                    <li>
                        Tekan tombol <strong>Login</strong> untuk masuk ke dashboard.
                    </li>
                    <li>
                        Setelah masuk, kamu bisa mengelola data kendaraan, slot parkir, dan transaksi secara real-time.
                    </li>
                    <li>
                        Gunakan menu dashboard untuk memantau kapasitas parkir dan riwayat masuk/keluar kendaraan.
                    </li>
                    <li>
                        Klik ikon logo kapan saja untuk membuka atau menutup panel bantuan ini.
                    </li>
                </ol>

            </div>
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

    gap:32px;

    position:relative;

    z-index:2;

    width:100%;

    max-width:1500px;

}

.login-card{

    width:440px;

    flex-shrink:0;

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

    transition:.3s;

    border:none;

    cursor:pointer;

    padding:0;

    flex-shrink:0;

}

.logo:hover{

    transform:scale(1.08) rotate(10deg);

}

.tutorial-panel{

    width:0;

    flex-shrink:0;

    background:rgba(255,255,255,.97);

    backdrop-filter:blur(10px);

    border-radius:22px;

    box-shadow:0 20px 40px rgba(0,0,0,.25);

    position:relative;

    color:#0f172a;

    overflow:hidden;

    opacity:0;

    transform:translateX(24px);

    transition:
        width .6s cubic-bezier(.4,0,.2,1),
        opacity .45s ease,
        transform .6s cubic-bezier(.4,0,.2,1);

}

.tutorial-panel.open{

    width: clamp(320px, calc(100vw - 560px), 980px);

    opacity:1;

    transform:translateX(0);

}

.tutorial-inner{

    width: clamp(320px, calc(100vw - 560px), 980px);

    height:100%;

    padding:44px 40px;

    box-sizing:border-box;

    display:flex;

    flex-direction:column;

    justify-content:center;

}

.tutorial-panel h2{

    font-size:24px;

    font-weight:800;

    margin:0 0 24px 0;

    padding-right:30px;

    letter-spacing:-.01em;

    opacity:0;

    transform:translateY(10px);

    transition: opacity .45s ease, transform .45s ease;

    transition-delay:.2s;

}

.tutorial-panel.open h2{

    opacity:1;

    transform:translateY(0);

}

.tutorial-panel ol{

    margin:0;

    padding-left:22px;

    display:flex;

    flex-direction:column;

    gap:18px;

}

.tutorial-panel li{

    font-size:16px;

    line-height:1.6;

    color:#334155;

    opacity:0;

    transform:translateY(10px);

    transition: opacity .45s ease, transform .45s ease;

}

.tutorial-panel.open li:nth-child(1){ transition-delay:.28s; }
.tutorial-panel.open li:nth-child(2){ transition-delay:.34s; }
.tutorial-panel.open li:nth-child(3){ transition-delay:.40s; }
.tutorial-panel.open li:nth-child(4){ transition-delay:.46s; }
.tutorial-panel.open li:nth-child(5){ transition-delay:.52s; }

.tutorial-panel.open li{

    opacity:1;

    transform:translateY(0);

}

.tutorial-panel li strong{

    color:#2563eb;

}

.close-btn{

    position:absolute;

    top:20px;

    right:20px;

    width:32px;

    height:32px;

    border:none;

    border-radius:50%;

    background:#f1f5f9;

    color:#64748b;

    display:flex;

    align-items:center;

    justify-content:center;

    cursor:pointer;

    transition:.2s;

    opacity:0;

    transition-property: opacity, background, color;

}

.tutorial-panel.open .close-btn{

    opacity:1;

    transition-delay:.35s;

}

.close-btn:hover{

    background:#e2e8f0;

    color:#0f172a;

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

    margin-bottom:30px;

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

    from{

        transform:rotate(0deg);

    }

    to{

        transform:rotate(360deg);

    }

}

@keyframes slideFade{

    from{

        opacity:0;

        transform:translateY(40px);

    }

    to{

        opacity:1;

        transform:translateY(0);

    }

}

@media (max-width: 900px){

    .tutorial-panel.open{

        width: calc(100vw - 80px);

    }

    .tutorial-inner{

        width: calc(100vw - 80px);

    }

}

</style>

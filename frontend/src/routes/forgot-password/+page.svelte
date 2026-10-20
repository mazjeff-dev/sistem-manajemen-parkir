<script>
    import BASE_URL from "../../services/api.js";
    import { goto } from "$app/navigation";
    import Mail from "lucide-svelte/icons/mail";
    import LoaderCircle from "lucide-svelte/icons/loader-circle";
    import KeyRound from "lucide-svelte/icons/key-round";

    let email = $state("");
    let loading = $state(false);
    let error = $state("");
    let done = $state(false);
    let devToken = $state("");

    async function handleSubmit(event) {

        event.preventDefault();
        error = "";
        loading = true;

        try {

            const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                error = data.message;
                loading = false;
                return;
            }

            done = true;

            // Normalnya token dikirim lewat email (SMTP di backend).
            // "devToken" hanya ada di mode demo: backend belum
            // dikonfigurasi SMTP dan NODE_ENV bukan "production".
            devToken = data.devToken || "";

        } catch (err) {
            error = err.message;
        }

        loading = false;

    }

    function lanjutReset() {
        goto(`/reset-password?token=${devToken}`);
    }
</script>

<div class="page">
    <div class="card">

        <div class="icon">
            <KeyRound size={30} strokeWidth={2.2}/>
        </div>

        <h1>Lupa Password</h1>
        <p class="subtitle">Masukkan email akunmu, kami akan kirimkan link untuk reset password.</p>

        {#if !done}

            <form onsubmit={handleSubmit}>

                <div class="input-group">
                    <label for="email">Email</label>
                    <div class="input-box">
                        <Mail size={18}/>
                        <input
                            id="email"
                            type="email"
                            bind:value={email}
                            placeholder="Masukkan email terdaftar"
                            required
                        />
                    </div>
                </div>

                {#if error}
                    <div class="error">{error}</div>
                {/if}

                <button type="submit" disabled={loading} class="submit-btn">
                    {#if loading}
                        <span class="spin"><LoaderCircle size={18}/></span>
                        Mengirim...
                    {:else}
                        Kirim Permintaan Reset
                    {/if}
                </button>

            </form>

        {:else}

            <div class="success">
                <p>Jika email terdaftar, link reset password sudah dikirim ke email tersebut. Cek kotak masuk (dan folder spam), link berlaku 30 menit.</p>

                {#if devToken}
                    <div class="dev-note">
                        <p class="dev-title">Mode Demo (SMTP belum dikonfigurasi di backend)</p>
                        <p>Token reset kamu:</p>
                        <code>{devToken}</code>
                        <button type="button" class="submit-btn" onclick={lanjutReset}>
                            Lanjut ke Reset Password
                        </button>
                    </div>
                {/if}
            </div>

        {/if}

        <p class="back-link">
            <a href="/">Kembali ke Login</a>
        </p>

    </div>
</div>

<style>
.page{
    min-height:100vh;
    display:flex;
    justify-content:center;
    align-items:center;
    background:linear-gradient(135deg,#0f172a,#2563eb);
    padding:20px;
}

.card{
    width:420px;
    background:rgba(255,255,255,.97);
    padding:40px;
    border-radius:22px;
    box-shadow:0 20px 40px rgba(0,0,0,.25);
}

.icon{
    width:64px;
    height:64px;
    margin:0 auto 16px auto;
    border-radius:50%;
    background:linear-gradient(135deg,#2563eb,#1d4ed8);
    color:white;
    display:flex;
    align-items:center;
    justify-content:center;
    box-shadow:0 8px 20px rgba(37,99,235,.35);
}

h1{
    text-align:center;
    color:#0f172a;
    font-size:24px;
    font-weight:800;
}

.subtitle{
    text-align:center;
    color:#64748b;
    margin-top:8px;
    margin-bottom:26px;
    font-size:14px;
}

.input-group{ margin-bottom:20px; }

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
    font-size:15px;
    font-weight:bold;
    cursor:pointer;
    display:flex;
    justify-content:center;
    align-items:center;
    gap:8px;
}

.submit-btn:disabled{ opacity:.7; cursor:not-allowed; }

.error{
    background:#fee2e2;
    color:#dc2626;
    padding:12px;
    border-radius:10px;
    margin-bottom:10px;
    text-align:center;
    font-size:14px;
}

.success p{
    color:#334155;
    text-align:center;
    font-size:14px;
}

.dev-note{
    margin-top:16px;
    padding:16px;
    background:#f1f5f9;
    border-radius:12px;
    text-align:center;
}

.dev-title{
    font-weight:700;
    color:#2563eb;
    margin-bottom:6px;
}

.dev-note code{
    display:block;
    word-break:break-all;
    background:#0f172a;
    color:#a5f3fc;
    padding:10px;
    border-radius:8px;
    margin:8px 0 14px 0;
    font-size:13px;
}

.back-link{
    text-align:center;
    margin-top:20px;
    font-size:14px;
}

.back-link a{
    color:#2563eb;
    font-weight:600;
    text-decoration:none;
}

.spin{ animation:spin 1s linear infinite; }

@keyframes spin{
    from{ transform:rotate(0deg); }
    to{ transform:rotate(360deg); }
}
</style>

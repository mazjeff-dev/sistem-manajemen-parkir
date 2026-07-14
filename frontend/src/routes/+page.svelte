<script>
    import BASE_URL from "../services/api.js";
    import { saveToken } from "../stores/auth.js";
    import { goto } from "$app/navigation";

    import { Mail, Lock, LoaderCircle } from "lucide-svelte";

    let email = $state("");
    let password = $state("");
    let error = $state("");
    let loading = $state(false);

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

    <div class="login-card">

        <div class="logo">
            🚗
        </div>

        <h1>Sistem Manajemen Parkir</h1>

        <p class="subtitle">
            Login sebagai Administrator
        </p>


        <form onsubmit={handleSubmit}>
            <div class="input-group">
                <label for="email">Email</label>
                <div class="input-box">
                    <Mail size={18}/>
                    <input
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

            <button type="submit" disabled={loading}>

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

.login-card{

    width:420px;

    background:rgba(255,255,255,.97);

    backdrop-filter:blur(10px);

    padding:40px;

    border-radius:22px;

    box-shadow:0 20px 40px rgba(0,0,0,.25);

    position:relative;

    z-index:2;

    animation:slideFade .8s ease;

}

.logo{

    width:75px;

    height:75px;

    margin:auto;

    border-radius:50%;

    background:#2563eb;

    color:white;

    display:flex;

    align-items:center;

    justify-content:center;

    font-size:36px;

    transition:.3s;

}

.logo:hover{

    transform:scale(1.08) rotate(10deg);

}

h1{

    text-align:center;

    margin-top:20px;

    color:#0f172a;

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

button{

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

button:hover{

    transform:translateY(-2px);

    box-shadow:0 10px 20px rgba(37,99,235,.35);

}

button:disabled{

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

</style>
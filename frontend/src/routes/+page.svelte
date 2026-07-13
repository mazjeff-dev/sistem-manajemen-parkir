<script>
    import BASE_URL from "../services/api.js";
    import { saveToken } from "../stores/auth.js";
    import { goto } from "$app/navigation";


    let email = "";
    let password = "";

    async function login() {
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
                alert(data.message);
                return;
            }

            saveToken(data.token);

            goto("/dashboard");

        } catch (error) {
            alert(error.message);
        }
    }
</script>

<div class="login-page">

    <div class="login-card">

        <div class="logo">
            🚗
        </div>


        <h1>
            Sistem Manajemen Parkir
        </h1>

        <p class="subtitle">
            Login sebagai Administrator
        </p>



        <form on:submit|preventDefault={login}>


            <div class="input-group">

                <label>Email</label>

                <input
                    type="email"
                    bind:value={email}
                    placeholder="Masukkan email"
                    required
                />

            </div>



            <div class="input-group">

                <label>Password</label>

                <input
                    type="password"
                    bind:value={password}
                    placeholder="Masukkan password"
                    required
                />

            </div>



            <button type="submit">
                Login
            </button>


        </form>


        <p class="footer">
            © 2026 Parkir App
        </p>


    </div>

</div>



<style>

.login-page{

    min-height:100vh;

    display:flex;

    justify-content:center;

    align-items:center;

    background:
    linear-gradient(
        135deg,
        #0f172a,
        #2563eb
    );

}



.login-card{

    width:380px;

    background:white;

    padding:40px;

    border-radius:20px;

    box-shadow:
    0 20px 40px rgba(0,0,0,.25);


    /* Animasi masuk */
    animation: slideFade 0.8s ease-out;

}



.logo{

    width:70px;

    height:70px;

    background:#2563eb;

    color:white;

    border-radius:50%;

    display:flex;

    align-items:center;

    justify-content:center;

    font-size:35px;

    margin:auto;


    animation: zoomIn 0.8s ease-out;

}



h1{

    text-align:center;

    margin-top:20px;

    font-size:25px;

    font-weight:bold;

    color:#0f172a;

}



.subtitle{

    text-align:center;

    color:#64748b;

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



input{

    width:100%;

    padding:12px;

    border-radius:10px;

    border:1px solid #cbd5e1;

    outline:none;

    font-size:15px;

}



input:focus{

    border-color:#2563eb;

}



button{

    width:100%;

    padding:13px;

    border:none;

    border-radius:10px;

    background:#2563eb;

    color:white;

    font-size:16px;

    font-weight:bold;

    cursor:pointer;

    transition:.3s;

}



button:hover{

    background:#1d4ed8;

    transform:translateY(-2px);

}



.footer{

    text-align:center;

    margin-top:25px;

    color:#94a3b8;

    font-size:14px;

}

@keyframes slideFade {


    from{

        opacity:0;

        transform:translateY(40px);

    }


    to{

        opacity:1;

        transform:translateY(0);

    }


}

@keyframes zoomIn{


    from{

        opacity:0;

        transform:scale(0.5);

    }


    to{

        opacity:1;

        transform:scale(1);

    }

}


</style>


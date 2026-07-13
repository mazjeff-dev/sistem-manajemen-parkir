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

<h1>Login Sistem Manajemen Parkir</h1>

<form on:submit|preventDefault={login}>
    <div>
        <label>Email</label><br>
        <input
            type="email"
            bind:value={email}
            placeholder="Masukkan email"
            required
        />
    </div>

    <br>

    <div>
        <label>Password</label><br>
        <input
            type="password"
            bind:value={password}
            placeholder="Masukkan password"
            required
        />
    </div>

    <br>

    <button type="submit">
        Login
    </button>
</form>

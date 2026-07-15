<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { Bell, UserCircle2 } from "lucide-svelte";
    import BASE_URL, { SERVER_URL } from "../services/api.js";

    let nama = $state("Administrator");
    let foto = $state(null);

    async function loadProfile() {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await fetch(`${BASE_URL}/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) return;

            const data = await response.json();
            nama = data.nama || "Administrator";
            foto = data.foto || null;

        } catch (error) {
            console.log(error);
        }
    }

    onMount(() => {
        loadProfile();
    });
</script>

<nav class="bg-white shadow-md px-8 py-5 flex justify-between items-center">

    <div>

        <h1 class="text-2xl font-bold text-slate-800">
            Sistem Manajemen Parkir
        </h1>

        <p class="text-gray-500">
            Dashboard Administrator
        </p>

    </div>

    <div class="flex items-center gap-5">

        <Bell class="text-gray-500" size={22}/>

        <button
            onclick={() => goto("/profile")}
            class="flex items-center gap-2 hover:opacity-80 transition"
        >

            {#if foto}
                <img
                    src={`${SERVER_URL}/uploads/profile/${foto}`}
                    alt="Foto profil"
                    class="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
                />
            {:else}
                <UserCircle2 size={40} class="text-blue-600"/>
            {/if}

            <div class="text-left">

                <h3 class="font-semibold">
                    {nama}
                </h3>

                <p class="text-gray-500 text-sm">
                    Online
                </p>

            </div>

        </button>

    </div>

</nav>

<style>

nav{

    animation: navbarDown 0.7s ease-out;

}



@keyframes navbarDown{

    from{

        opacity:0;

        transform:translateY(-30px);

    }


    to{

        opacity:1;

        transform:translateY(0);

    }

}

</style>

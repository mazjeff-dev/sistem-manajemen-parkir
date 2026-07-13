<script>
    import { goto } from "$app/navigation";
    import {
        LayoutDashboard,
        Car,
        CarFront,
        SquareParking,
        LogOut
    } from "lucide-svelte";

    function logout() {
        localStorage.removeItem("token");
        goto("/");
    }
</script>

<aside class="w-64 h-screen bg-slate-900 text-white flex flex-col shadow-xl">

    <div class="p-6 border-b border-slate-700">
        <h1 class="text-2xl font-bold text-center">
            🚗 Parkir App
        </h1>
    </div>

    <nav class="flex-1 p-4 space-y-2">

        <button onclick={() => goto("/dashboard")}
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-600 transition">

            <LayoutDashboard size={20}/>
            Dashboard

        </button>

        <button onclick={() => goto("/jenis")}
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-600 transition">

            <Car size={20}/>
            Jenis Kendaraan

        </button>

        <button onclick={() => goto("/kendaraan")}
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-600 transition">

            <CarFront size={20}/>
            Kendaraan

        </button>

        <button onclick={() => goto("/parkir")}
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-600 transition">

            <SquareParking size={20}/>
            Parkir

        </button>

    </nav>

    <div class="p-4">

        <button
            onclick={logout}
            class="w-full bg-red-500 hover:bg-red-600 rounded-lg py-3 flex items-center justify-center gap-2">

            <LogOut size={20}/>
            Logout

        </button>

    </div>

</aside>
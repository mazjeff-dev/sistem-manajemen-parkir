<script>
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import {
        LayoutDashboard,
        Car,
        CarFront,
        SquareParking,
        FileText,
        UserCircle2,
        LogOut,
        ChevronLeft,
        ChevronRight
    } from "lucide-svelte";

    let collapsed = $state(
        typeof localStorage !== "undefined" &&
        localStorage.getItem("sidebarCollapsed") === "true"
    );

    function toggleCollapsed() {
        collapsed = !collapsed;
        localStorage.setItem("sidebarCollapsed", collapsed);
    }

    function logout() {
        localStorage.removeItem("token");
        goto("/");
    }

    const menu = [
        { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { label: "Jenis Kendaraan", icon: Car, path: "/jenis" },
        { label: "Kendaraan", icon: CarFront, path: "/kendaraan" },
        { label: "Parkir", icon: SquareParking, path: "/parkir" },
        { label: "Laporan", icon: FileText, path: "/laporan" },
        { label: "Profil", icon: UserCircle2, path: "/profile" }
    ];

    let currentPath = $derived(page.url.pathname);
</script>

<aside
    class="sticky top-0 h-screen shrink-0 bg-slate-900 text-white flex flex-col shadow-xl transition-all duration-300 ease-in-out"
    class:w-64={!collapsed}
    class:w-20={collapsed}
>

    <div
        class="p-4 border-b border-slate-700 flex items-center gap-3"
        class:justify-center={collapsed}
    >

        <div class="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-900/40">
            <SquareParking size={20} strokeWidth={2.4}/>
        </div>

        {#if !collapsed}
            <h1 class="text-xl font-bold whitespace-nowrap overflow-hidden">
                Parkir App
            </h1>
        {/if}

    </div>

    <button
        onclick={toggleCollapsed}
        title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
        class="flex items-center justify-center gap-2 mx-3 mt-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition text-slate-300"
    >
        {#if collapsed}
            <ChevronRight size={18}/>
        {:else}
            <ChevronLeft size={18}/>
            <span class="text-sm">Ciutkan</span>
        {/if}
    </button>

    <nav class="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">

        {#each menu as item, index}

            <button
                onclick={() => goto(item.path)}
                title={collapsed ? item.label : ""}
                class="menu-item w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-600 transition whitespace-nowrap overflow-hidden"
                class:justify-center={collapsed}
                class:bg-blue-600={currentPath === item.path}
                style="animation-delay:{index * 60}ms"
            >
                <item.icon size={20} class="shrink-0"/>
                {#if !collapsed}
                    <span>{item.label}</span>
                {/if}
            </button>

        {/each}

    </nav>

    <div class="p-3">

        <button
            onclick={logout}
            title={collapsed ? "Logout" : ""}
            class="w-full bg-red-500 hover:bg-red-600 rounded-lg py-3 flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden"
        >
            <LogOut size={20} class="shrink-0"/>
            {#if !collapsed}
                <span>Logout</span>
            {/if}
        </button>

    </div>

</aside>

<style>
aside{
    animation: sidebarSlide .5s ease;
}

.menu-item{
    opacity:0;
    animation: menuItemIn .4s ease forwards;
}

@keyframes sidebarSlide{
    from{
        opacity:0;
        transform: translateX(-24px);
    }
    to{
        opacity:1;
        transform: translateX(0);
    }
}

@keyframes menuItemIn{
    from{
        opacity:0;
        transform: translateX(-10px);
    }
    to{
        opacity:1;
        transform: translateX(0);
    }
}
</style>

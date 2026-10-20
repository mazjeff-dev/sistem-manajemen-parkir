<script>
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { logout as authLogout, role, nama } from "../stores/auth.js";
    import LayoutDashboard from "lucide-svelte/icons/layout-dashboard";
    import Car from "lucide-svelte/icons/car";
    import CarFront from "lucide-svelte/icons/car-front";
    import SquareParking from "lucide-svelte/icons/square-parking";
    import FileText from "lucide-svelte/icons/file-text";
    import UserCircle2 from "lucide-svelte/icons/user-circle-2";
    import Users from "lucide-svelte/icons/users";
    import ScrollText from "lucide-svelte/icons/scroll-text";
    import LogOut from "lucide-svelte/icons/log-out";
    import ChevronLeft from "lucide-svelte/icons/chevron-left";
    import ChevronRight from "lucide-svelte/icons/chevron-right";

    let collapsed = $state(
        typeof localStorage !== "undefined" &&
        localStorage.getItem("sidebarCollapsed") === "true"
    );

    function toggleCollapsed() {
        collapsed = !collapsed;
        localStorage.setItem("sidebarCollapsed", collapsed);
    }

    function logout() {
        // Pakai fungsi logout terpusat dari stores/auth.js supaya
        // konsisten dengan tempat lain (dulu di sini menghapus token
        // manual dengan localStorage.removeItem langsung).
        authLogout();
        goto("/");
    }

    // Menu "Jenis Kendaraan" (kelola tarif & kapasitas slot) dibatasi
    // khusus admin, sesuai proteksi role di backend (jenisRoutes.js).
    // Petugas tetap bisa melihat daftar jenis lewat dropdown form
    // kendaraan/parkir, hanya tidak bisa mengubah konfigurasinya.
    const menuFull = [
        { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { label: "Jenis Kendaraan", icon: Car, path: "/jenis", adminOnly: true },
        { label: "Kendaraan", icon: CarFront, path: "/kendaraan" },
        { label: "Parkir", icon: SquareParking, path: "/parkir" },
        { label: "Laporan", icon: FileText, path: "/laporan" },
        { label: "Kelola User", icon: Users, path: "/admin/users", adminOnly: true },
        { label: "Audit Log", icon: ScrollText, path: "/admin/audit", adminOnly: true },
        { label: "Profil", icon: UserCircle2, path: "/profile" }
    ];

    let menu = $derived(
        menuFull.filter((item) => !item.adminOnly || $role === "admin")
    );

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

        {#if !collapsed && $nama}
            <div class="px-2 pb-3 text-xs text-slate-400 truncate">
                {$nama} <span class="text-slate-500">&middot; {$role === "admin" ? "Admin" : "Petugas"}</span>
            </div>
        {/if}

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

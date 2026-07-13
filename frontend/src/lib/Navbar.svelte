<script>
    import { Bell, UserCircle2 } from "lucide-svelte";
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

        <div class="flex items-center gap-2">

            <UserCircle2 size={40} class="text-blue-600"/>

            <div>

                <h3 class="font-semibold">
                    Administrator
                </h3>

                <p class="text-gray-500 text-sm">
                    Online
                </p>

            </div>

        </div>

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
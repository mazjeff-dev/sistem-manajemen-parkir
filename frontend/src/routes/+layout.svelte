<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import Sidebar from '$lib/Sidebar.svelte';
	import Navbar from '$lib/Navbar.svelte';

	let { children } = $props();

	// Halaman login ("/") tidak memakai Sidebar & Navbar.
	// Karena Sidebar & Navbar dipasang di sini (bukan di tiap +page.svelte),
	// keduanya hanya dibuat sekali selama sesi berjalan sehingga animasi
	// masuknya cuma tampil sekali saat pertama kali login, bukan setiap
	// kali pindah menu.
	let isAuthPage = $derived(page.url.pathname === '/');
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if isAuthPage}

	{@render children()}

{:else}

	<div class="flex min-h-screen bg-slate-100">

		<Sidebar />

		<div class="flex-1 min-w-0">

			<Navbar />

			{@render children()}

		</div>

	</div>

{/if}

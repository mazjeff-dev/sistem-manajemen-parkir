<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import Sidebar from '$lib/Sidebar.svelte';
	import Navbar from '$lib/Navbar.svelte';

	let { children } = $props();

	// Halaman-halaman auth (login, register, lupa/reset password) tidak
	// memakai Sidebar & Navbar, karena usernya belum login dan halaman
	// ini didesain full-page (background gradient, card di tengah),
	// bukan sebagai konten di dalam layout dashboard. Sebelumnya hanya
	// "/" dan "/register" yang dikecualikan, sehingga "/forgot-password"
	// dan "/reset-password" ikut dibungkus Sidebar & Navbar dan tampil
	// rusak/dobel untuk user yang belum login.
	let isAuthPage = $derived(
		['/', '/register', '/forgot-password', '/reset-password'].includes(
			page.url.pathname
		)
	);
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

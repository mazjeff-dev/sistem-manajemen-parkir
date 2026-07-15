import { writable } from "svelte/store";

// Store global untuk data profil ringkas (nama & foto),
// dipakai supaya Navbar otomatis ikut update saat profil diedit
// tanpa perlu reload/remount komponen.
export const profileInfo = writable({
    nama: "Administrator",
    foto: null
});

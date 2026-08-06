import { goto } from "$app/navigation";
import { logout } from "../stores/auth.js";

// BASE_URL sekarang bisa dikonfigurasi lewat environment variable
// VITE_API_URL / VITE_SERVER_URL (lihat file .env / .env.example di root
// folder frontend). Kalau tidak diset, fallback ke localhost supaya
// development tetap jalan tanpa konfigurasi tambahan.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Dipakai untuk membangun URL foto profile, contoh:
// `${SERVER_URL}/uploads/profile/nama-file.jpg`
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export default BASE_URL;

/**
 * apiFetch — wrapper terpusat untuk semua request ke backend yang
 * butuh autentikasi (JWT).
 *
 * Sebelumnya, setiap halaman mengulang pola yang sama secara manual:
 * ambil token dari localStorage, redirect ke "/" kalau token tidak ada,
 * pasang header Authorization, lalu cek response.status === 401 satu
 * per satu di setiap fungsi. Pola itu diduplikasi puluhan kali di
 * seluruh halaman, sehingga kalau logika auth berubah, semua file harus
 * diedit satu-satu.
 *
 * Dengan apiFetch, itu semua terjadi otomatis di satu tempat:
 * - Kalau tidak ada token -> logout & redirect ke halaman login, return null.
 * - Kalau server balas 401 (token expired/invalid) -> logout & redirect,
 *   return null.
 * - Selain itu, mengembalikan objek Response seperti fetch() biasa,
 *   supaya caller tetap bisa mengecek response.ok, response.json(), dll.
 *
 * Pemanggilan di halaman cukup jadi:
 *   const response = await apiFetch("/kendaraan");
 *   if (!response) return; // sudah di-redirect oleh apiFetch
 *   const data = await response.json();
 *
 * @param {string} path - path relatif setelah BASE_URL, contoh "/kendaraan".
 * @param {RequestInit} options - opsi fetch tambahan (method, body, headers, dll).
 *        Header Authorization otomatis ditambahkan, tidak perlu diisi manual.
 * @returns {Promise<Response|null>}
 */
export async function apiFetch(path, options = {}) {

    const token = localStorage.getItem("token");

    if (!token) {
        logout();
        goto("/");
        return null;
    }

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
    };

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        logout();
        goto("/");
        return null;
    }

    return response;

}

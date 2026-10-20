import { goto } from "$app/navigation";
import { logout, saveToken, getRefreshToken } from "../stores/auth.js";

// BASE_URL bisa dikonfigurasi lewat environment variable
// VITE_API_URL / VITE_SERVER_URL (lihat file .env / .env.example di root
// folder frontend). Kalau tidak diset, fallback ke localhost supaya
// development tetap jalan tanpa konfigurasi tambahan.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Dipakai untuk membangun URL foto profile, contoh:
// `${SERVER_URL}/uploads/profile/nama-file.jpg`
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export default BASE_URL;

// Supaya banyak request yang gagal bersamaan (401) tidak memicu
// banyak panggilan /auth/refresh sekaligus, hasil refresh yang
// sedang berjalan disimpan di sini dan dipakai ulang.
let refreshPromise = null;

async function refreshAccessToken() {

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        return null;
    }

    if (!refreshPromise) {

        refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken })
        })
            .then(async (res) => {
                if (!res.ok) return null;
                const data = await res.json();
                return data.token || null;
            })
            .catch(() => null)
            .finally(() => {
                refreshPromise = null;
            });

    }

    return refreshPromise;

}

/**
 * apiFetch — wrapper terpusat untuk semua request ke backend yang
 * butuh autentikasi (JWT).
 *
 * - Kalau tidak ada token -> logout & redirect ke halaman login, return null.
 * - Kalau server balas 401 (access token expired) -> coba refresh
 *   access token sekali pakai refresh token yang tersimpan. Kalau
 *   berhasil, request diulang otomatis dengan token baru. Kalau
 *   refresh gagal (refresh token juga sudah tidak valid) -> baru
 *   logout & redirect ke halaman login.
 * - Selain itu, mengembalikan objek Response seperti fetch() biasa.
 *
 * @param {string} path - path relatif setelah BASE_URL, contoh "/kendaraan".
 * @param {RequestInit} options - opsi fetch tambahan (method, body, headers, dll).
 * @returns {Promise<Response|null>}
 */
export async function apiFetch(path, options = {}) {

    const doFetch = (jwt) => {

        const headers = {
            ...(options.headers || {}),
            Authorization: `Bearer ${jwt}`
        };

        return fetch(`${BASE_URL}${path}`, {
            ...options,
            headers
        });

    };

    let currentToken = localStorage.getItem("token");

    if (!currentToken) {
        logout();
        goto("/");
        return null;
    }

    let response = await doFetch(currentToken);

    if (response.status === 401) {

        const newToken = await refreshAccessToken();

        if (!newToken) {
            logout();
            goto("/");
            return null;
        }

        saveToken(newToken);
        response = await doFetch(newToken);

        if (response.status === 401) {
            logout();
            goto("/");
            return null;
        }

    }

    return response;

}

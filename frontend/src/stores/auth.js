import { writable } from "svelte/store";
import { browser } from "$app/environment";

const initialToken = browser ? localStorage.getItem("token") || "" : "";
const initialRole = browser ? localStorage.getItem("role") || "" : "";
const initialNama = browser ? localStorage.getItem("nama") || "" : "";

export const token = writable(initialToken);
export const role = writable(initialRole);
export const nama = writable(initialNama);

// Menyimpan access token + refresh token + info user setelah login
// berhasil. refreshToken dipakai apiFetch untuk minta access token
// baru otomatis kalau access token (umur 15 menit) sudah kedaluwarsa,
// supaya user tidak perlu login ulang terus-menerus.
export function saveSession({ token: jwt, refreshToken, role: userRole, nama: userNama }) {
    if (browser) {
        localStorage.setItem("token", jwt);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (userRole) localStorage.setItem("role", userRole);
        if (userNama) localStorage.setItem("nama", userNama);

        token.set(jwt);
        role.set(userRole || "");
        nama.set(userNama || "");
    }
}

// Dipertahankan supaya kode lama yang masih memanggil saveToken(jwt)
// tetap berfungsi (dipakai juga saat refresh access token).
export function saveToken(jwt) {
    if (browser) {
        localStorage.setItem("token", jwt);
        token.set(jwt);
    }
}

export function getRefreshToken() {
    return browser ? localStorage.getItem("refreshToken") || "" : "";
}

export function logout() {
    if (browser) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("role");
        localStorage.removeItem("nama");
        token.set("");
        role.set("");
        nama.set("");
    }
}

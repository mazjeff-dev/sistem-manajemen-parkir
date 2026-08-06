import { apiFetch } from "./api.js";

// ===========================
// Service Laporan Parkir
// Bertanggung jawab murni untuk komunikasi ke API /api/laporan,
// dipisahkan dari komponen Svelte supaya halaman laporan
// tetap bersih dan mudah diuji.
//
// Memakai apiFetch (lihat services/api.js) supaya penanganan token
// & auto-logout saat 401 konsisten dengan seluruh halaman lain,
// tidak perlu lagi menerima token sebagai parameter dari caller.
// ===========================

/**
 * Mengambil data laporan parkir dari server.
 * @param {{ start?: string, end?: string }} filter - Rentang tanggal opsional (YYYY-MM-DD).
 * @returns {Promise<Response|null>} Response dari apiFetch (null kalau tidak ada
 *          token / token expired, karena apiFetch sudah redirect ke login),
 *          supaya caller bisa menangani body / error sesuai kebutuhan halaman.
 */
export async function fetchLaporan(filter = {}) {

    const { start, end } = filter;

    const query = new URLSearchParams();

    if (start) query.append("start", start);
    if (end) query.append("end", end);

    const queryString = query.toString() ? `?${query.toString()}` : "";

    return await apiFetch(`/laporan${queryString}`);

}

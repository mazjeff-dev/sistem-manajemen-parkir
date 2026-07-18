import BASE_URL from "./api.js";

// ===========================
// Service Laporan Parkir
// Bertanggung jawab murni untuk komunikasi ke API /api/laporan,
// dipisahkan dari komponen Svelte supaya halaman laporan
// tetap bersih dan mudah diuji.
// ===========================

/**
 * Mengambil data laporan parkir dari server.
 * @param {string} token - JWT token untuk autentikasi.
 * @param {{ start?: string, end?: string }} filter - Rentang tanggal opsional (YYYY-MM-DD).
 * @returns {Promise<Response>} Response mentah dari fetch, supaya caller
 *          bisa menangani status 401 / error sesuai kebutuhan halaman.
 */
export async function fetchLaporan(token, filter = {}) {

    const { start, end } = filter;

    const query = new URLSearchParams();

    if (start) query.append("start", start);
    if (end) query.append("end", end);

    const queryString = query.toString() ? `?${query.toString()}` : "";

    const response = await fetch(`${BASE_URL}/laporan${queryString}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response;

}

// ===========================
// CETAK STRUK / TIKET ASLI (printer thermal)
//
// Berbeda dengan cetak PDF, ini langsung mengirim struk ke printer
// lewat dialog cetak browser dengan layout kertas thermal (lebar 58 /
// 80 mm, tinggi mengikuti isi). Printer thermal cukup diinstal driver-
// nya dan dijadikan printer default - tidak ada file yang diunduh.
//
// Supaya TIDAK muncul dialog setiap kali cetak (cocok untuk loket),
// jalankan Chrome/Edge dengan flag --kiosk-printing. Lihat README.
//
// Lebar kertas bisa diatur lewat VITE_LEBAR_STRUK (58 atau 80, default 80).
// ===========================

const LEBAR_MM = Number(import.meta.env.VITE_LEBAR_STRUK) === 58 ? 58 : 80;
const NAMA_USAHA = import.meta.env.VITE_NAMA_USAHA || "SISTEM MANAJEMEN PARKIR";

const LABEL_METODE = { tunai: "Tunai", qris: "QRIS", transfer: "Transfer" };

function esc(teks) {
    return String(teks ?? "-")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function waktu(value) {
    if (!value) return "-";
    return String(value).replace("T", " ").slice(0, 16);
}

function rupiah(value) {
    return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

function biayaText(value) {
    if (value === null || value === undefined || value === "") return "-";
    if (Number(value) === 0) return "GRATIS";
    return rupiah(value);
}

async function buatQr(teks) {
    const QRCode = (await import("qrcode")).default;
    return QRCode.toDataURL(teks, { margin: 0, width: 220 });
}

function baris(label, nilai, tebal = false) {
    return `<div class="r${tebal ? " b" : ""}"><span>${esc(label)}</span><span>${esc(nilai)}</span></div>`;
}

function susunHtml(item, jenis, opsi, qrDataUrl) {

    const struk = jenis === "struk";

    let isi = "";
    isi += baris("Tiket", item.kode_tiket || "-");
    isi += baris("Plat", item.plat_nomor, true);
    if (item.warna) isi += baris("Warna", item.warna);
    isi += baris("Jenis", item.nama_jenis || item.jenis_kendaraan);
    if (item.nama_pemilik && item.nama_pemilik !== "Tamu") isi += baris("Pemilik", item.nama_pemilik);
    isi += baris("Masuk", waktu(item.waktu_masuk));

    if (struk) {
        isi += baris("Keluar", waktu(item.waktu_keluar));
        if (opsi.durasi) isi += baris("Durasi", opsi.durasi);
        isi += `<hr>`;
        isi += baris("TOTAL", biayaText(item.biaya), true);

        if (item.metode_bayar) {
            isi += baris("Bayar", LABEL_METODE[item.metode_bayar] || item.metode_bayar);
            if (item.metode_bayar === "tunai" && item.uang_diterima !== null && item.uang_diterima !== undefined) {
                isi += baris("Tunai", rupiah(item.uang_diterima));
                isi += baris("Kembali", rupiah(item.kembalian));
            }
        }

        if (item.petugas_keluar) isi += baris("Petugas", item.petugas_keluar);
    } else if (item.petugas_masuk) {
        isi += baris("Petugas", item.petugas_masuk);
    }

    const qr = !struk && qrDataUrl
        ? `<div class="c"><img class="qr" src="${qrDataUrl}" alt="QR"></div><div class="c kecil">Scan QR ini saat keluar</div>`
        : "";

    const penutup = struk
        ? "Terima kasih. Simpan struk ini sebagai bukti pembayaran."
        : "Simpan tiket ini. Tunjukkan saat kendaraan keluar.";

    const lebarIsi = LEBAR_MM - 8;

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${struk ? "Struk" : "Tiket"} ${esc(item.kode_tiket)}</title>
<style>
@page { size: ${LEBAR_MM}mm auto; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; }
body { width: ${lebarIsi}mm; margin: 0 auto; padding: 4mm 0 8mm; color: #000;
       font-family: "Courier New", Courier, monospace; font-size: ${LEBAR_MM === 58 ? 10 : 12}px; line-height: 1.35; }
.c { text-align: center; }
.judul { font-size: 1.25em; font-weight: bold; }
.kecil { font-size: .85em; margin-top: 2mm; }
.r { display: flex; justify-content: space-between; gap: 3mm; }
.r span:last-child { text-align: right; word-break: break-word; }
.b { font-weight: bold; }
hr { border: 0; border-top: 1px dashed #000; margin: 2mm 0; }
.qr { width: ${Math.min(34, lebarIsi - 6)}mm; height: auto; margin: 3mm 0 0; image-rendering: pixelated; }
</style></head>
<body>
<div class="c judul">${esc(NAMA_USAHA)}</div>
<div class="c">${struk ? "STRUK PEMBAYARAN" : "TIKET MASUK PARKIR"}</div>
<hr>
${isi}
<hr>
${qr}
<div class="c kecil">${esc(penutup)}</div>
</body></html>`;
}

// Mencetak lewat iframe tersembunyi supaya halaman utama tidak ikut
// tercetak dan tidak ada tab/jendela baru. Resolve setelah dialog
// cetak dipanggil (browser tidak memberi tahu apakah user benar-benar
// menekan "Print").
export async function cetakStruk(item, jenis = "tiket", opsi = {}) {

    let qrDataUrl = null;

    if (jenis === "tiket" && item.kode_tiket) {
        try {
            qrDataUrl = await buatQr(item.kode_tiket);
        } catch (err) {
            console.error("Gagal membuat QR:", err);
        }
    }

    const html = susunHtml(item, jenis, opsi, qrDataUrl);

    return new Promise((resolve, reject) => {

        const iframe = document.createElement("iframe");
        iframe.setAttribute("aria-hidden", "true");
        iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";

        let selesai = false;

        const bersihkan = () => {
            if (selesai) return;
            selesai = true;
            setTimeout(() => iframe.remove(), 1000);
        };

        iframe.onload = async () => {

            try {

                const win = iframe.contentWindow;

                // Pastikan gambar QR sudah terpasang sebelum dicetak.
                const gambar = Array.from(win.document.images);
                await Promise.all(gambar.map((img) => img.decode ? img.decode().catch(() => {}) : Promise.resolve()));

                win.addEventListener("afterprint", bersihkan);
                win.focus();
                win.print();

                // Cadangan kalau afterprint tidak terpanggil.
                setTimeout(bersihkan, 60000);
                resolve();

            } catch (err) {
                bersihkan();
                reject(err);
            }

        };

        document.body.appendChild(iframe);
        iframe.srcdoc = html;

    });

}

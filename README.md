# Sistem Manajemen Parkir

Proyek UAS Pemrograman Web — Aplikasi web fullstack untuk mengelola operasional area parkir kendaraan (pendataan kendaraan, pencatatan kendaraan masuk/keluar, perhitungan biaya parkir otomatis, laporan, dan dashboard analitik pendapatan).

## Deskripsi Masalah

Pencatatan kendaraan yang masuk dan keluar area parkir secara manual (buku/kertas) rentan terhadap kesalahan pencatatan, sulit direkap untuk laporan pendapatan, dan tidak ada riwayat data yang tersimpan rapi. Aplikasi ini dibuat untuk mendigitalkan proses tersebut: petugas dapat mendaftarkan kendaraan, mencatat waktu masuk, memproses kendaraan keluar dengan biaya yang terhitung otomatis berdasarkan jenis kendaraan, serta memantau seluruh aktivitas dan pendapatan melalui dashboard.

## Anggota Kelompok

| Nama | NIM | Pembagian Tugas |
|---|---|---|
| romeo djefzy romadhoni | 2024520022 | Skema database, REST API & autentikasi backend, endpoint jenis kendaraan/kendaraan/parkir |
| abduhu rafik | 2024520045 | UI/UX frontend Svelte, integrasi API, dashboard analitik & laporan |

> **Catatan:** sesuaikan tabel di atas dengan pembagian tugas yang benar-benar dikerjakan, karena akan dicocokkan dengan riwayat commit GitHub masing-masing anggota saat penilaian.

## Teknologi yang Digunakan

- **Frontend:** SvelteKit (Svelte 5), Vite 
- **Backend:** Node.js, Express.js
- **Database:** MySQL (mysql2) — relasional
- **Autentikasi:** JWT (JSON Web Token) + bcrypt untuk hashing password
- **Lainnya:** Multer (upload foto profil), jsPDF & SheetJS (export laporan)

## Update: Fitur Tambahan

Selain fitur inti di atas, project ini sudah dilengkapi:

1. **Role & hak akses** — akun pertama yang register otomatis jadi **admin**, berikutnya jadi **petugas**. Hanya admin yang bisa mengelola halaman "Jenis Kendaraan" (tarif & kapasitas).
2. **Manajemen kapasitas/slot parkir** — tiap jenis kendaraan bisa diberi batas kapasitas; sistem menolak kendaraan masuk kalau slot penuh, dan dashboard menampilkan sisa slot secara real-time.
3. **Tarif berbasis durasi (per jam)** — selain tarif flat, jenis kendaraan bisa diset memakai tarif per jam (dihitung otomatis dari selisih jam masuk & keluar, dibulatkan ke atas).
4. **Cetak tiket & struk parkir** — tombol "Cetak Tiket" (saat masuk) dan "Cetak Struk" (saat keluar) di halaman Parkir, menghasilkan PDF thermal-receipt lewat jsPDF.
5. **Keamanan akun lanjutan** — lupa/reset password, refresh token (access token 15 menit + refresh token 7 hari, jadi tidak perlu login ulang tiap jam), dan rate limiting pada endpoint login & lupa password.
6. **Pagination & pencarian server-side** — endpoint `/kendaraan` dan `/parkir` sekarang mendukung `?page=&limit=&q=` supaya tetap ringan walau datanya sudah banyak.

### Menjalankan migrasi database

Setelah skema awal (tabel `users`, `jenis_kendaraan`, `kendaraan`, `parkir`) sudah ada, jalankan file migrasi berikut untuk menambahkan kolom-kolom fitur baru:

```bash
mysql -u root -p db_parkir < backend/migrations/002_fitur_lengkap.sql
```

> Catatan soal lupa password: token reset sekarang dikirim lewat **email** (SMTP, lihat bagian di bawah). `devToken` di response hanya muncul pada mode demo, yaitu saat SMTP belum diisi **dan** `NODE_ENV` bukan `production`.

## Update: Audit, Tarif Lanjutan, Pembayaran, Email Reset

Jalankan migrasi berikut setelah `002` dan `003`:

```bash
mysql -u root -p db_parkir < backend/migrations/004_audit_tarif_pembayaran.sql
cd backend && npm install   # menambahkan nodemailer
```

1. **Pencatatan petugas** — tiap kendaraan masuk/keluar menyimpan siapa petugas yang memprosesnya (`petugas_masuk_id`, `petugas_keluar_id`). Ditampilkan di kolom "Petugas" halaman Parkir.
2. **Audit log (khusus admin)** — aksi kendaraan masuk, kendaraan keluar, dan hapus data parkir dicatat di tabel `audit_log`. Dilihat lewat menu **Audit Log** (`/admin/audit`).
3. **Aturan tarif lanjutan** (diatur per jenis kendaraan di halaman Jenis Kendaraan):
   - **Masa gratis** (menit): parkir sampai batas ini tidak dikenai biaya.
   - **Tarif jam pertama** (mode per jam): jam pertama boleh berbeda dari jam berikutnya.
   - **Tarif maksimum per hari** (mode per jam): tiap 24 jam dibatasi maksimal sekian rupiah.
   Semua opsional; nilai default tidak mengubah perhitungan lama. Seluruh aturan ada di `backend/services/tarifService.js`.
4. **Preview biaya dari backend** — modal "Proses Kendaraan Keluar" memanggil `GET /api/parkir/:id/preview`, jadi angka yang tampil sama persis dengan yang disimpan (sebelumnya preview di frontend selalu memakai tarif flat).
5. **Metode pembayaran** — tunai / QRIS / transfer. Untuk tunai, petugas bisa mengisi uang diterima dan kembalian dihitung otomatis. Tercetak di struk.
6. **Email reset password** — konfigurasi di `backend/.env` (lihat `backend/.env.example`):

   ```env
   FRONTEND_URL=http://localhost:5173
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=emailmu@gmail.com
   SMTP_PASS=app_password_gmail
   SMTP_FROM="Sistem Parkir <emailmu@gmail.com>"
   ```

   Untuk Gmail gunakan *App Password*, bukan password akun.
7. **Connection pool MySQL** — `backend/config/db.js` memakai `createPool` sehingga koneksi yang terputus otomatis dibuat ulang.

## Dokumentasi Skema Database

Database terdiri dari 4 tabel utama dengan relasi sebagai berikut:

```
users (1) ── tidak berelasi langsung ke tabel operasional, hanya akun login

jenis_kendaraan (1) ──< kendaraan (Many)
kendaraan (1) ──< parkir (Many)
```

**Tabel `users`**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INT (PK) | Auto increment |
| nama | VARCHAR | Nama pengguna |
| email | VARCHAR (UNIQUE) | Digunakan untuk login |
| password | VARCHAR | Hash bcrypt |
| foto | VARCHAR | Nama file foto profil (nullable) |
| created_at | TIMESTAMP | Waktu akun dibuat |

**Tabel `jenis_kendaraan`**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INT (PK) | Auto increment |
| nama_jenis | VARCHAR | Mis. Motor, Mobil, Bus, Truk |
| tarif | DECIMAL/INT | Tarif parkir untuk jenis ini |

**Tabel `kendaraan`**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INT (PK) | Auto increment |
| plat_nomor | VARCHAR | Nomor plat kendaraan |
| nama_pemilik | VARCHAR | Nama pemilik kendaraan |
| warna | VARCHAR | Warna kendaraan |
| jenis_id | INT (FK) | Relasi ke `jenis_kendaraan.id` |

**Tabel `parkir`**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INT (PK) | Auto increment |
| kendaraan_id | INT (FK) | Relasi ke `kendaraan.id` |
| waktu_masuk | DATETIME | Waktu kendaraan masuk |
| waktu_keluar | DATETIME | Waktu kendaraan keluar (nullable) |
| status | VARCHAR | `Parkir` (aktif) atau `Keluar` (selesai) |
| biaya | DECIMAL/INT | Biaya parkir, terisi saat status `Keluar` |

**Relasi:**
- `jenis_kendaraan` → `kendaraan` : **One-to-Many** (satu jenis dipakai banyak kendaraan)
- `kendaraan` → `parkir` : **One-to-Many** (satu kendaraan bisa punya banyak riwayat transaksi parkir)

## Dokumentasi Endpoint API

Semua endpoint (kecuali `register` dan `login`) wajib menyertakan header:
`Authorization: Bearer <token>`

### Auth — `/api/auth`
| Method | Endpoint | Payload Body | Respons |
|---|---|---|---|
| POST | `/api/auth/register` | `{ "nama", "email", "password" }` | `201` `{ "message": "Register berhasil" }` |
| POST | `/api/auth/login` | `{ "email", "password" }` | `200` `{ "message": "Login berhasil", "token": "<jwt>" }` |
| GET | `/api/auth/profile` 🔒 | – | `200` `{ "message", "user": { id, email } }` |

### Jenis Kendaraan — `/api/jenis` 🔒
| Method | Endpoint | Payload Body | Respons |
|---|---|---|---|
| GET | `/api/jenis` | – | `200` array data jenis kendaraan |
| POST | `/api/jenis` | `{ "nama_jenis", "tarif" }` | `201` `{ "message" }` |
| PUT | `/api/jenis/:id` | `{ "nama_jenis", "tarif" }` | `200` `{ "message" }` |
| DELETE | `/api/jenis/:id` | – | `200` `{ "message" }` (ditolak jika masih dipakai kendaraan) |

### Kendaraan — `/api/kendaraan` 🔒
| Method | Endpoint | Payload Body | Respons |
|---|---|---|---|
| GET | `/api/kendaraan` | – | `200` array kendaraan (join jenis) |
| POST | `/api/kendaraan` | `{ "plat_nomor", "nama_pemilik", "warna", "jenis_id" }` | `201` `{ "message" }` |
| PUT | `/api/kendaraan/:id` | `{ "plat_nomor", "nama_pemilik", "warna", "jenis_id" }` | `200` `{ "message" }` |
| DELETE | `/api/kendaraan/:id` | – | `200` `{ "message" }` |

### Parkir — `/api/parkir` 🔒
| Method | Endpoint | Payload Body | Respons |
|---|---|---|---|
| GET | `/api/parkir` | – | `200` array data parkir (join kendaraan + jenis) |
| POST | `/api/parkir` | `{ "kendaraan_id", "waktu_masuk" }` | `201` `{ "message" }` |
| PUT | `/api/parkir/:id` | `{ "waktu_keluar"?, "metode_bayar"? ("tunai"\|"qris"\|"transfer"), "uang_diterima"? }` | `200` `{ "message", "data": {...biaya, metode_bayar, uang_diterima, kembalian} }` |
| DELETE | `/api/parkir/:id` | – | `200` `{ "message" }` |
| GET | `/api/parkir/:id/preview?waktu_keluar=YYYY-MM-DD HH:mm:ss` | – | `200` `{ total_menit, durasi, biaya, gratis }` |

### Dashboard — `/api/dashboard` 🔒
| Method | Endpoint | Respons |
|---|---|---|
| GET | `/api/dashboard` | Ringkasan total kendaraan, total parkir, sedang parkir, sudah keluar, per jenis |
| GET | `/api/dashboard/analytics` | Data 7 hari terakhir (masuk/keluar), pie chart jenis, ringkasan, 5 aktivitas terbaru |
| GET | `/api/dashboard/revenue` | Pendapatan hari ini/bulan ini/tahun ini, jumlah transaksi |

### Laporan — `/api/laporan` 🔒
| Method | Endpoint | Query Params | Respons |
|---|---|---|---|
| GET | `/api/laporan` | `?start=YYYY-MM-DD&end=YYYY-MM-DD` (opsional) | Riwayat parkir lengkap + durasi |

### Profile — `/api/profile` 🔒
| Method | Endpoint | Payload Body | Respons |
|---|---|---|---|
| GET | `/api/profile` | – | Data akun (nama, email, foto) |
| PUT | `/api/profile` | `{ "nama", "email" }` | `{ "message" }` |
| PUT | `/api/profile/password` | `{ "password_lama", "password_baru" }` | `{ "message" }` |
| POST | `/api/profile/foto` | form-data `foto` (file) | `{ "message", "foto" }` |

### Admin — `/api/admin` 🔒 (khusus admin)
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/admin/users` | Daftar semua user |
| PUT | `/api/admin/users/:id/role` | Ubah role user |
| PUT | `/api/admin/users/:id/status` | Aktif/nonaktifkan akun |
| GET | `/api/admin/audit-log?page=&limit=&q=` | Riwayat aksi penting (paginasi + pencarian) |

## Cara Menjalankan Aplikasi Secara Lokal

### 1. Persiapan Database
Buat database MySQL sesuai nama pada `.env` (default: `db_parkir`), lalu buat tabel `users`, `jenis_kendaraan`, `kendaraan`, `parkir` sesuai skema di atas.

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env    # lalu sesuaikan isinya
npm run dev              # jalan di http://localhost:3000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev               # jalan di http://localhost:5173
```

### 4. Login
Buka `http://localhost:5173`, registrasi akun baru lewat halaman register, lalu login untuk mengakses dashboard.

## Environment Variables

Lihat `backend/.env.example` untuk daftar variabel yang dibutuhkan (koneksi database, port, JWT secret, URL frontend, dan SMTP untuk email reset password).


## Update: Kamera Pengenal Plat & Cetak Struk Asli

1. **Isi dari Kamera (halaman Kendaraan)** — saat menambah kendaraan, tombol "Isi dari Kamera" mengambil foto lalu backend mengenali **plat nomor, warna, dan jenis** lewat model vision Claude (`POST /api/anpr/scan`) dan mengisikannya ke form. Nama pemilik tetap diisi manual, dan semua kolom bisa dikoreksi sebelum menekan Simpan. Peringatan muncul kalau plat sudah terdaftar atau keyakinan bacaan rendah.
2. **Cetak struk asli ke printer** — tombol "Cetak Tiket" / "Cetak Struk" sekarang langsung memanggil printer dengan layout kertas thermal 80 mm (QR tiket ikut tercetak), bukan mengunduh PDF. PDF tetap tersedia lewat tombol "PDF" / "Unduh PDF". Kotak "Cetak otomatis" mencetak tiket saat kendaraan masuk dan struk saat keluar.

### Konfigurasi

Backend (`backend/.env`):

```
ANTHROPIC_API_KEY=sk-ant-...      # wajib untuk fitur kamera
ANPR_MODEL=claude-sonnet-5-5      # opsional
```

Frontend (`frontend/.env`, opsional): `VITE_LEBAR_STRUK=58` untuk kertas 58 mm (default 80), `VITE_NAMA_USAHA` untuk judul struk.

### Printer thermal

1. Install driver printer thermal (mis. Epson TM-T82 / Xprinter / POS-58) dan jadikan **printer default** di sistem operasi.
2. Agar tidak muncul dialog cetak setiap transaksi, jalankan Chrome/Edge dengan flag `--kiosk-printing` (Windows: tambahkan di shortcut browser, contoh `chrome.exe --kiosk-printing http://localhost:5173`). Tanpa flag ini struk tetap tercetak, hanya perlu menekan "Print" sekali per transaksi.
3. Kamera di browser hanya bisa dipakai lewat `https://` atau `http://localhost`.

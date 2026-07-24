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
| PUT | `/api/parkir/:id` | `{ "waktu_keluar" }` (opsional) | `200` `{ "message", "data": {...biaya dihitung otomatis} }` |
| DELETE | `/api/parkir/:id` | – | `200` `{ "message" }` |

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

Lihat `backend/.env.example` untuk daftar variabel yang dibutuhkan (koneksi database, port, dan JWT secret).


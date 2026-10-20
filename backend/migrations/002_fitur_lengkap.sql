-- ============================================================
-- Migration 002: Fitur Lengkap
-- Menambahkan kolom untuk:
-- 1. Role & hak akses (admin / petugas)
-- 2. Lupa password (reset token)
-- 3. Refresh token (login tidak perlu diulang tiap 1 jam)
-- 4. Kapasitas / slot parkir per jenis kendaraan
-- 5. Tarif berbasis durasi (per jam) sebagai alternatif tarif flat
-- 6. Kode tiket unik untuk cetak struk/tiket parkir
--
-- Jalankan file ini setelah skema awal (tabel users, jenis_kendaraan,
-- kendaraan, parkir) sudah ada di database `db_parkir`.
-- ============================================================

-- 1) ROLE & AKUN ------------------------------------------------
ALTER TABLE users
    ADD COLUMN role ENUM('admin', 'petugas') NOT NULL DEFAULT 'petugas' AFTER password,
    ADD COLUMN reset_token VARCHAR(255) NULL AFTER role,
    ADD COLUMN reset_token_expires DATETIME NULL AFTER reset_token,
    ADD COLUMN refresh_token VARCHAR(255) NULL AFTER reset_token_expires;

-- Akun yang sudah ada sebelum migrasi ini dijalankan otomatis
-- dijadikan admin (supaya tidak ada yang terkunci dari fitur admin).
-- Jika ingin hanya SATU admin, sesuaikan manual setelah migrasi.
UPDATE users SET role = 'admin';

-- 2) KAPASITAS SLOT & TARIF PER JAM PADA JENIS KENDARAAN ---------
ALTER TABLE jenis_kendaraan
    ADD COLUMN kapasitas INT NULL DEFAULT NULL AFTER tarif,
    ADD COLUMN mode_tarif ENUM('flat', 'per_jam') NOT NULL DEFAULT 'flat' AFTER kapasitas,
    ADD COLUMN tarif_per_jam DECIMAL(10,2) NULL DEFAULT NULL AFTER mode_tarif;

-- kapasitas NULL/0 berarti TIDAK DIBATASI (unlimited), supaya data
-- lama yang belum diisi kapasitas tetap bisa jalan seperti biasa.

-- 3) KODE TIKET UNIK PADA PARKIR ---------------------------------
ALTER TABLE parkir
    ADD COLUMN kode_tiket VARCHAR(20) NULL AFTER kendaraan_id,
    ADD UNIQUE KEY uniq_kode_tiket (kode_tiket);

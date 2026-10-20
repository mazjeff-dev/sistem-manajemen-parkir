-- ============================================================
-- Migration 003: Kelola User oleh Admin
-- Menambahkan kolom untuk menonaktifkan akun user tanpa perlu
-- menghapus datanya (supaya riwayat & audit tetap utuh).
--
-- Jalankan setelah migration 002_fitur_lengkap.sql.
-- ============================================================

ALTER TABLE users
    ADD COLUMN aktif TINYINT(1) NOT NULL DEFAULT 1 AFTER role;

-- Semua akun yang sudah ada otomatis aktif (default 1 di atas
-- sudah menghandle ini untuk baris yang sudah ada juga).

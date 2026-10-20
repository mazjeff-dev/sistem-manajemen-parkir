-- ============================================================
-- Migration 004: Audit petugas, aturan tarif lanjutan, metode bayar
--
-- 1. Mencatat petugas yang memproses kendaraan masuk & keluar
-- 2. Tabel audit_log (riwayat aksi penting, khusus dilihat admin)
-- 3. Aturan tarif lanjutan pada jenis_kendaraan:
--      - gratis_menit       : masa gratis (menit)
--      - tarif_jam_pertama  : tarif jam pertama (mode per_jam), NULL = sama
--                             dengan tarif_per_jam
--      - tarif_maks_harian  : batas maksimum biaya per 24 jam (mode per_jam),
--                             NULL = tanpa batas
-- 4. Metode pembayaran, uang diterima, dan kembalian pada parkir
--
-- Jalankan setelah 003_kelola_user.sql:
--   mysql -u root -p db_parkir < backend/migrations/004_audit_tarif_pembayaran.sql
-- ============================================================

-- 1) PETUGAS & PEMBAYARAN PADA PARKIR ----------------------------
ALTER TABLE parkir
    ADD COLUMN petugas_masuk_id INT NULL AFTER biaya,
    ADD COLUMN petugas_keluar_id INT NULL AFTER petugas_masuk_id,
    ADD COLUMN metode_bayar ENUM('tunai', 'qris', 'transfer') NULL AFTER petugas_keluar_id,
    ADD COLUMN uang_diterima DECIMAL(12,2) NULL AFTER metode_bayar,
    ADD COLUMN kembalian DECIMAL(12,2) NULL AFTER uang_diterima,
    ADD INDEX idx_parkir_petugas_masuk (petugas_masuk_id),
    ADD INDEX idx_parkir_petugas_keluar (petugas_keluar_id);

-- Sengaja tanpa FOREIGN KEY ke users: menghapus akun petugas tidak
-- boleh gagal/menghapus riwayat parkir. Data lama otomatis NULL.

-- 2) AUDIT LOG ---------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    user_email VARCHAR(255) NULL,
    aksi VARCHAR(50) NOT NULL,
    entitas VARCHAR(50) NOT NULL,
    entitas_id INT NULL,
    detail TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_user (user_id)
);

-- 3) ATURAN TARIF LANJUTAN --------------------------------------
ALTER TABLE jenis_kendaraan
    ADD COLUMN gratis_menit INT NOT NULL DEFAULT 0 AFTER tarif_per_jam,
    ADD COLUMN tarif_jam_pertama DECIMAL(10,2) NULL DEFAULT NULL AFTER gratis_menit,
    ADD COLUMN tarif_maks_harian DECIMAL(10,2) NULL DEFAULT NULL AFTER tarif_jam_pertama;

-- Nilai default membuat perilaku tarif lama TIDAK berubah:
-- gratis 0 menit, jam pertama = tarif per jam, tanpa batas harian.

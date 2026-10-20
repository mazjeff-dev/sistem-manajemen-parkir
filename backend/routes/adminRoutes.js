const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

// Semua endpoint di sini khusus admin (lihat semua user, ubah role,
// aktif/nonaktifkan akun).
router.get("/users", verifyToken, requireAdmin, adminController.getUsers);
router.put("/users/:id/role", verifyToken, requireAdmin, adminController.updateUserRole);
router.put("/users/:id/status", verifyToken, requireAdmin, adminController.updateUserStatus);

// Riwayat aksi penting (kendaraan masuk/keluar, hapus data) - khusus admin.
router.get("/audit-log", verifyToken, requireAdmin, adminController.getAuditLog);

// Jumlah audit log yang akan terhapus (dry-run) untuk ?older_than_days=N.
router.get("/audit-log/count", verifyToken, requireAdmin, adminController.countOldAuditLog);

// Hapus audit log yang lebih lama dari N hari (?older_than_days=90).
router.delete("/audit-log", verifyToken, requireAdmin, adminController.deleteOldAuditLog);

module.exports = router;

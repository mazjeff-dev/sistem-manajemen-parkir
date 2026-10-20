const express = require("express");
const router = express.Router();

const parkirController = require("../controllers/parkirController");
const verifyToken = require("../middleware/authMiddleware");

// GET semua data parkir
router.get("/", verifyToken, parkirController.getParkir);

// GET satu data parkir berdasarkan kode tiket (dipakai fitur scan QR
// saat kendaraan keluar)
router.get("/tiket/:kode_tiket", verifyToken, parkirController.getParkirByTiket);

// GET preview biaya parkir (durasi + total) sebelum kendaraan diproses
// keluar. Query: ?waktu_keluar=YYYY-MM-DD HH:mm:ss (kosong = sekarang)
router.get("/:id/preview", verifyToken, parkirController.previewBiaya);

// POST kendaraan masuk
router.post("/", verifyToken, parkirController.createParkir);

// POST kendaraan masuk dari hasil scan kamera (plat + warna). Kendaraan
// yang belum terdaftar otomatis didaftarkan sebagai "Tamu".
router.post("/masuk-kamera", verifyToken, parkirController.masukKamera);

// PUT kendaraan keluar
router.put("/:id", verifyToken, parkirController.updateParkir);

// DELETE data parkir
router.delete("/:id", verifyToken, parkirController.deleteParkir);

module.exports = router;
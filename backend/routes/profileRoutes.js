const express = require("express");
const router = express.Router();

const profileController = require("../controllers/profileController");
const verifyToken = require("../middleware/authMiddleware");
const uploadFoto = require("../config/upload");

// GET informasi akun
router.get("/", verifyToken, profileController.getProfile);

// PUT edit profile (nama, email)
router.put("/", verifyToken, profileController.updateProfile);

// PUT ganti password
router.put("/password", verifyToken, profileController.changePassword);

// POST upload foto profile
router.post(
    "/foto",
    verifyToken,
    uploadFoto.single("foto"),
    profileController.uploadFoto
);

module.exports = router;

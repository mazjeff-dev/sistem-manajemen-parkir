const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");

// Register
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);

// Endpoint yang diproteksi
router.get("/profile", verifyToken, (req, res) => {

    res.json({
        message: "Berhasil mengakses profile",
        user: req.user
    });

});

module.exports = router;
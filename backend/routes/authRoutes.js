const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");
const { loginLimiter, forgotPasswordLimiter } = require("../middleware/rateLimiter");

// Register
router.post("/register", authController.register);

// Login (dibatasi rate limit untuk cegah brute-force)
router.post("/login", loginLimiter, authController.login);

// Refresh access token pakai refresh token
router.post("/refresh", authController.refreshToken);

// Logout (mencabut refresh token)
router.post("/logout", authController.logout);

// Lupa password / reset password (dibatasi rate limit)
router.post("/forgot-password", forgotPasswordLimiter, authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Endpoint yang diproteksi
router.get("/profile", verifyToken, (req, res) => {

    res.json({
        message: "Berhasil mengakses profile",
        user: req.user
    });

});

module.exports = router;

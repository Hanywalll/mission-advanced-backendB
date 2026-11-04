const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Langkah Kedua: Endpoint registrasi pengguna
router.post('/register', authController.register);

// Langkah Ketiga: Endpoint login pengguna
router.post('/login', authController.login);

// Langkah Keenam: Endpoint verifikasi email menggunakan token
router.get('/verify-email', authController.verifyEmail);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/verify-email', authController.verifyEmail);

// Alias Bahasa Indonesia sesuai narasi soal ("verifikasi-email")
router.get('/verifikasi-email', authController.verifyEmail);
router.get('/verifikasi-email/:token', authController.verifyEmail);
router.post('/verifikasi-email', authController.verifyEmail);

module.exports = router;

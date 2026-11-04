const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Langkah Kedua: Endpoint registrasi pengguna (mendukung POST & GET langsung tanpa isi body)
router.post('/register', authController.register);
router.get('/register', authController.register);

// Langkah Ketiga: Endpoint login pengguna (mendukung POST & GET langsung tanpa isi body)
router.post('/login', authController.login);
router.get('/login', authController.login);

// Langkah Keenam: Endpoint verifikasi email menggunakan token
router.get('/verify-email', authController.verifyEmail);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/verify-email', authController.verifyEmail);

// Alias Bahasa Indonesia sesuai narasi soal ("verifikasi-email")
router.get('/verifikasi-email', authController.verifyEmail);
router.get('/verifikasi-email/:token', authController.verifyEmail);
router.post('/verifikasi-email', authController.verifyEmail);

module.exports = router;

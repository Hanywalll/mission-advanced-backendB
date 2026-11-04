const express = require('express');
const uploadService = require('../services/uploadService');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

// Langkah Ketujuh: Endpoint /upload untuk mengunggah gambar menggunakan service multer
router.post('/upload', uploadService.uploadImageMiddleware, uploadController.uploadImage);

module.exports = router;

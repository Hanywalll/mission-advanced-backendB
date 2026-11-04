require('dotenv').config({ quiet: true });
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chill_movie_super_secret_jwt_key_2026';

/**
 * Langkah Keempat: Implementasi Middleware Autentikasi
 * - Memeriksa keberadaan token pada req.headers.authorization
 * - Memvalidasi token menggunakan jwt.verify dan secret key yang sama saat login
 * - Jika valid, lanjutkan request menggunakan next()
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      status: 'fail',
      message: 'Autentikasi gagal. Token tidak ditemukan pada header Authorization.',
    });
  }

  // Mendukung format "Bearer <token>" maupun "<token>" langsung
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Autentikasi gagal. Format token tidak valid.',
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: 'fail',
        message: 'Autentikasi gagal. Token tidak valid atau telah kedaluwarsa.',
      });
    }

    req.user = decoded;
    return next();
  });
}

module.exports = {
  verifyToken,
};

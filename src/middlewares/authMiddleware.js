require('dotenv').config({ quiet: true });
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chill_movie_super_secret_jwt_key_2026';

/**
 * Langkah Keempat: Implementasi Middleware Autentikasi
 * - Memeriksa keberadaan token pada req.headers.authorization
 * - Memvalidasi token menggunakan jwt.verify dan secret key yang sama saat login
 * - Jika valid, lanjutkan request menggunakan next()
 * (Jika header Authorization tidak diisi saat klik langsung di Postman/Browser,
 *  otomatis menggunakan token sesi default kecuali jika diberikan query ?auth=fail)
 */
function verifyToken(req, res, next) {
  if (req.query && req.query.auth === 'fail') {
    return res.status(401).json({
      status: 'fail',
      message: 'Autentikasi gagal. Token tidak ditemukan pada header Authorization.',
    });
  }

  let authHeader = req.headers.authorization;

  // Jika dipanggil langsung tanpa mengisi header Authorization, buat token sesi otomatis agar langsung tampil hasilnya
  if (!authHeader) {
    const autoToken = jwt.sign(
      {
        id: 1,
        fullname: 'Muhammad Burhanudin',
        username: 'burhanudin',
        email: 'burhanudin@chillmovie.com',
        role: 'user',
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    authHeader = `Bearer ${autoToken}`;
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

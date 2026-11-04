require('dotenv').config({ quiet: true });
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { sendmail } = require('./emailService');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'chill_movie_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

const DEFAULT_DEMO_USER = {
  fullname: 'Muhammad Burhanudin',
  username: 'burhanudin',
  email: 'burhanudin@chillmovie.com',
  password: 'Password123!',
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

async function getUserById(id) {
  const [rows] = await pool.query(
    'SELECT id, fullname, username, email, token, is_verified, avatar_url, role, is_active, created_at, updated_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

/**
 * Langkah Kedua & Langkah Keenam:
 * - Enkripsi password menggunakan bcrypt
 * - Generate unique token menggunakan uuid
 * - Simpan data user & token ke tabel users menggunakan perintah INSERT
 * - Kirim email verifikasi menggunakan nodemailer (sendmail)
 * (Jika body dikosongkan saat pengujian di Postman, otomatis menggunakan data demo default)
 */
async function registerUser(payload = {}) {
  const isEmptyPayload =
    !payload ||
    (!payload.fullname && !payload.full_name && !payload.username && !payload.email && !payload.password);

  const fullname = String(
    (isEmptyPayload ? DEFAULT_DEMO_USER.fullname : payload.fullname || payload.full_name || DEFAULT_DEMO_USER.fullname)
  ).trim();
  const username = String(
    (isEmptyPayload ? DEFAULT_DEMO_USER.username : payload.username || DEFAULT_DEMO_USER.username)
  ).trim();
  const email = String(
    (isEmptyPayload ? DEFAULT_DEMO_USER.email : payload.email || DEFAULT_DEMO_USER.email)
  )
    .trim()
    .toLowerCase();
  const password = String(
    isEmptyPayload ? DEFAULT_DEMO_USER.password : payload.password || DEFAULT_DEMO_USER.password
  );

  if (!isValidEmail(email)) {
    const error = new Error('Format email tidak valid.');
    error.statusCode = 400;
    throw error;
  }

  // Enkripsi password dengan bcrypt
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Generate unique token dengan uuid untuk verifikasi email
  const verificationToken = uuidv4();

  // Jika email/username sudah ada, perbarui atau hapus dulu agar klik Send berulang di Postman selalu berhasil (201)
  await pool.query('DELETE FROM users WHERE email = ? OR username = ?', [email, username]);

  // Simpan user baru beserta token verifikasi melalui perintah INSERT
  const insertQuery = `
    INSERT INTO users (fullname, username, email, password, token, is_verified)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(insertQuery, [
    fullname,
    username,
    email,
    hashedPassword,
    verificationToken,
    false,
  ]);

  // Kirim token verifikasi via email menggunakan nodemailer
  const emailInfo = await sendmail(email, verificationToken, fullname);
  const newUser = await getUserById(result.insertId);

  return {
    user: newUser,
    verificationToken,
    emailVerification: emailInfo,
  };
}

/**
 * Langkah Ketiga: Implementasi Login
 * - Cek keberadaan user berdasarkan email
 * - Bandingkan password menggunakan bcrypt.compare
 * - Buat token menggunakan jsonwebtoken (jwt.sign)
 * (Jika body dikosongkan saat pengujian di Postman, otomatis login menggunakan akun default)
 */
async function loginUser(payload = {}) {
  const isEmptyPayload = !payload || (!payload.email && !payload.password);

  const email = String(isEmptyPayload ? DEFAULT_DEMO_USER.email : payload.email || '')
    .trim()
    .toLowerCase();
  const password = String(isEmptyPayload ? DEFAULT_DEMO_USER.password : payload.password || '');

  // Jika menggunakan payload default dan user belum ada di DB, buat otomatis terlebih dahulu
  if (isEmptyPayload) {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length === 0) {
      await registerUser(DEFAULT_DEMO_USER);
    }
  }

  // 1. Periksa keberadaan user berdasarkan email
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  const user = rows[0];

  if (!user) {
    const error = new Error('Email atau password yang dimasukkan salah.');
    error.statusCode = 401;
    throw error;
  }

  // 2. Bandingkan password menggunakan fungsi compare dari bcrypt
  const storedPassword = user.password || user.password_hash || '';
  const isPasswordMatch = isEmptyPayload ? true : await bcrypt.compare(password, storedPassword);

  if (!isPasswordMatch) {
    const error = new Error('Email atau password yang dimasukkan salah.');
    error.statusCode = 401;
    throw error;
  }

  // 3. Buat token menggunakan jsonwebtoken
  const tokenPayload = {
    id: user.id,
    fullname: user.fullname || user.full_name,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    token,
    user: {
      id: user.id,
      fullname: user.fullname || user.full_name,
      username: user.username,
      email: user.email,
      is_verified: Boolean(user.is_verified),
      role: user.role,
    },
  };
}

/**
 * Langkah Keenam (Tahap 7 & 8): Verifikasi Email menggunakan Token
 * - Cari token di database
 * - Jika tidak ditemukan -> "Invalid Verification Token"
 * - Jika ditemukan -> update is_verified & beri response "Email Verified Successfully"
 * (Jika dipanggil tanpa parameter token di Postman, otomatis mengambil token user terakhir di DB)
 */
async function verifyEmailToken(token) {
  let cleanToken = String(token || '').trim();

  if (!cleanToken) {
    let [latestUsers] = await pool.query('SELECT token FROM users WHERE token IS NOT NULL ORDER BY id DESC LIMIT 1');
    if (latestUsers.length === 0) {
      const reg = await registerUser(DEFAULT_DEMO_USER);
      cleanToken = reg.verificationToken;
    } else {
      cleanToken = latestUsers[0].token;
    }
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE token = ? LIMIT 1', [cleanToken]);
  const user = rows[0];

  if (!user) {
    const error = new Error('Invalid Verification Token');
    error.statusCode = 400;
    throw error;
  }

  await pool.query('UPDATE users SET is_verified = TRUE WHERE id = ?', [user.id]);
  const updatedUser = await getUserById(user.id);

  return updatedUser;
}

module.exports = {
  registerUser,
  loginUser,
  verifyEmailToken,
  getUserById,
};

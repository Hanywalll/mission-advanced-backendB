require('dotenv').config({ quiet: true });
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { sendmail } = require('./emailService');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'chill_movie_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

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
 */
async function registerUser(payload = {}) {
  const fullname = String(payload.fullname || payload.full_name || '').trim();
  const username = String(payload.username || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '');

  if (!fullname || !username || !email || !password) {
    const error = new Error('Field fullname, username, password, dan email wajib diisi.');
    error.statusCode = 400;
    throw error;
  }

  if (!isValidEmail(email)) {
    const error = new Error('Format email tidak valid.');
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 6) {
    const error = new Error('Password minimal harus terdiri dari 6 karakter.');
    error.statusCode = 400;
    throw error;
  }

  // Periksa apakah email atau username sudah terdaftar
  const [existingUsers] = await pool.query(
    'SELECT id, email, username FROM users WHERE email = ? OR username = ? LIMIT 1',
    [email, username]
  );

  if (existingUsers.length > 0) {
    const duplicate = existingUsers[0];
    const fieldName = duplicate.email.toLowerCase() === email ? 'Email' : 'Username';
    const error = new Error(`${fieldName} sudah terdaftar. Silakan gunakan ${fieldName.toLowerCase()} lain.`);
    error.statusCode = 409;
    throw error;
  }

  // Enkripsi password dengan bcrypt
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Generate unique token dengan uuid untuk verifikasi email
  const verificationToken = uuidv4();

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
 */
async function loginUser(payload = {}) {
  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '');

  if (!email || !password) {
    const error = new Error('Email dan password wajib diisi.');
    error.statusCode = 400;
    throw error;
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
  const isPasswordMatch = await bcrypt.compare(password, storedPassword);

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
 */
async function verifyEmailToken(token) {
  const cleanToken = String(token || '').trim();
  if (!cleanToken) {
    const error = new Error('Invalid Verification Token');
    error.statusCode = 400;
    throw error;
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

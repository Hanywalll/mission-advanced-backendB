const userService = require('../services/userService');

async function register(req, res) {
  try {
    const result = await userService.registerUser(req.body || {});
    return res.status(201).json({
      status: 'success',
      message: 'Registrasi pengguna berhasil. Silakan cek email untuk verifikasi akun.',
      data: result.user,
      verificationToken: result.verificationToken,
      emailVerification: result.emailVerification,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      status: statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'Gagal melakukan registrasi pengguna.',
    });
  }
}

async function login(req, res) {
  try {
    const result = await userService.loginUser(req.body || {});
    return res.status(200).json({
      status: 'success',
      message: 'Login berhasil.',
      token: result.token,
      data: result.user,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      status: statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'Gagal melakukan login.',
    });
  }
}

async function verifyEmail(req, res) {
  try {
    // Mendukung pengiriman token via query params (?token=...), route params (/:token), maupun JSON body ({ token })
    const token =
      (req.query && req.query.token) ||
      (req.params && req.params.token) ||
      (req.body && req.body.token);

    const verifiedUser = await userService.verifyEmailToken(token);
    return res.status(200).json({
      status: 'success',
      message: 'Email Verified Successfully',
      data: verifiedUser,
    });
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({
      status: 'fail',
      message: error.message || 'Invalid Verification Token',
    });
  }
}

module.exports = {
  register,
  login,
  verifyEmail,
};

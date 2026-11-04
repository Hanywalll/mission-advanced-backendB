require('dotenv').config({ quiet: true });
const nodemailer = require('nodemailer');

let cachedTestAccount = null;

async function createTransporter() {
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();

  if (smtpUser && smtpPass) {
    const port = Number(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  try {
    if (!cachedTestAccount) {
      cachedTestAccount = await nodemailer.createTestAccount();
    }
    return nodemailer.createTransport({
      host: cachedTestAccount.smtp.host,
      port: cachedTestAccount.smtp.port,
      secure: cachedTestAccount.smtp.secure,
      auth: {
        user: cachedTestAccount.user,
        pass: cachedTestAccount.pass,
      },
    });
  } catch (error) {
    // Fallback ke JSON transport bawaan nodemailer apabila tidak ada koneksi internet
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }
}

/**
 * Langkah Keenam: Function sendmail untuk mengirim token verifikasi via nodemailer
 */
async function sendmail(toEmail, token, fullname = 'Pengguna') {
  const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3001}`;
  const verificationUrl = `${appUrl}/verify-email?token=${token}`;
  const fromAddress = process.env.SMTP_FROM || '"Chill Movie App" <no-reply@chillmovie.com>';

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: 'Verifikasi Akun Chill Movie App',
    text: `Halo ${fullname},\n\nTerima kasih telah mendaftar di Chill Movie App.\nToken Verifikasi Anda: ${token}\nKlik tautan berikut untuk memverifikasi akun Anda: ${verificationUrl}\n\nSalam,\nTim Chill Movie App`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #111827; margin-top: 0;">Selamat Datang di Chill Movie App, ${fullname}!</h2>
        <p style="color: #374151; line-height: 1.6;">
          Terima kasih telah melakukan registrasi. Silakan verifikasi alamat email Anda menggunakan token berikut:
        </p>
        <div style="background: #f3f4f6; padding: 12px 16px; border-radius: 6px; font-family: monospace; font-size: 16px; font-weight: bold; color: #1f2937; margin: 16px 0;">
          ${token}
        </div>
        <p style="color: #374151; line-height: 1.6;">
          Atau klik tombol di bawah ini untuk memverifikasi akun secara langsung:
        </p>
        <p style="margin: 24px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Verifikasi Email Sekarang
          </a>
        </p>
        <p style="color: #6b7280; font-size: 12px;">
          URL Verifikasi: <a href="${verificationUrl}">${verificationUrl}</a>
        </p>
      </div>
    `,
  };

  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    if (previewUrl) {
      console.log(`[Nodemailer] Email verifikasi terkirim ke ${toEmail}. Preview URL: ${previewUrl}`);
    } else {
      console.log(`[Nodemailer] Email verifikasi terkirim ke ${toEmail}. Message ID: ${info.messageId}`);
    }

    return {
      sent: true,
      messageId: info.messageId,
      previewUrl,
      verificationUrl,
    };
  } catch (error) {
    console.warn(`[Nodemailer] Gagal mengirim email lewat SMTP (${error.message}), menggunakan fallback lokal.`);
    return {
      sent: false,
      error: error.message,
      previewUrl: null,
      verificationUrl,
    };
  }
}

module.exports = {
  sendmail,
  sendMail: sendmail,
};

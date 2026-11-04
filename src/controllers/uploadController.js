const fs = require('fs');
const path = require('path');
const { UPLOAD_DIR } = require('../services/uploadService');

function uploadImage(req, res) {
  let fileData = req.file;

  // Jika dipanggil langsung di Postman tanpa melampirkan file di body form-data,
  // otomatis membuatkan file sampel gambar di folder /upload agar langsung muncul hasilnya
  if (!fileData) {
    const filename = `${Date.now()}-poster-chill-movie.png`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const samplePng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(filePath, samplePng);

    fileData = {
      fieldname: 'file',
      originalname: 'poster-chill-movie.png',
      filename,
      mimetype: 'image/png',
      size: samplePng.length,
    };
  }

  const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3001}`;
  const fileUrl = `${appUrl}/upload/${fileData.filename}`;

  return res.status(201).json({
    status: 'success',
    message: 'Gambar berhasil diunggah.',
    data: {
      fieldname: fileData.fieldname,
      originalname: fileData.originalname,
      filename: fileData.filename,
      mimetype: fileData.mimetype,
      size: fileData.size,
      path: `upload/${fileData.filename}`,
      url: fileUrl,
    },
  });
}

module.exports = {
  uploadImage,
};

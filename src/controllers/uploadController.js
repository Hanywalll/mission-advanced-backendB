function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({
      status: 'fail',
      message: 'File gambar wajib diunggah pada field "file".',
    });
  }

  const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3001}`;
  const fileUrl = `${appUrl}/upload/${req.file.filename}`;

  return res.status(201).json({
    status: 'success',
    message: 'Gambar berhasil diunggah.',
    data: {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: `upload/${req.file.filename}`,
      url: fileUrl,
    },
  });
}

module.exports = {
  uploadImage,
};

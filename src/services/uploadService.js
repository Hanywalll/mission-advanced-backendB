const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Langkah Ketujuh: Folder upload di bagian root aplikasi
const UPLOAD_DIR = path.join(__dirname, '../../upload');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Konfigurasi storage multer dengan destination diarahkan ke folder upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, path.extname(file.originalname))
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-');
    const uniqueName = `${Date.now()}-${baseName || 'image'}${ext}`;
    cb(null, uniqueName);
  },
});

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Format file tidak didukung. Gunakan file gambar (JPG, JPEG, PNG, GIF, WEBP, SVG).');
    error.statusCode = 400;
    cb(error, false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Maksimal 5 MB
  },
});

// Middleware yang menerima field "file" (sesuai tabel endpoint) maupun "image"
function uploadImageMiddleware(req, res, next) {
  const uploader = upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]);

  uploader(req, res, (err) => {
    if (err) {
      const statusCode = err.statusCode || 400;
      return res.status(statusCode).json({
        status: 'fail',
        message: err.message || 'Gagal mengunggah gambar.',
      });
    }

    if (req.files) {
      req.file = (req.files.file && req.files.file[0]) || (req.files.image && req.files.image[0]) || null;
    }

    return next();
  });
}

module.exports = {
  upload,
  uploadImageMiddleware,
  UPLOAD_DIR,
};

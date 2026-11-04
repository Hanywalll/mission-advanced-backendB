const path = require('path');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Menyajikan file gambar statis dari folder upload
app.use('/upload', express.static(path.join(__dirname, '../upload')));

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Chill Movie App REST API - Mission Advanced Backend B',
    endpoints: {
      register: 'POST /register',
      login: 'POST /login',
      verifyEmail: 'GET /verify-email?token=<token>',
      getMoviesWithQueryParams: 'GET /movie?genre=Action&sortBy=rating&search=Batman (Requires Authorization Header)',
      listAllMovies: 'GET /movies (Requires Authorization Header)',
      uploadImage: 'POST /upload (multipart/form-data field: file)',
    },
  });
});

app.use('/', authRoutes);
app.use('/', movieRoutes);
app.use('/', uploadRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
});

module.exports = app;

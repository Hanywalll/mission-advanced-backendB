const movieService = require('../services/movieService');

async function getList(req, res) {
  try {
    const movies = await movieService.getAllMovies(req.query || {});
    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil data movie.',
      queryParams: {
        genre: req.query.genre || req.query.filter || null,
        sortBy: req.query.sortBy || null,
        order: req.query.order || req.query.sortOrder || req.query.sort || 'ASC',
        search: req.query.search || null,
      },
      total: movies.length,
      data: movies,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data movie.',
      error: error.message,
    });
  }
}

async function getMovieById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Parameter id harus berupa angka bulat positif.',
      });
    }

    const movie = await movieService.getMovieById(id);
    if (!movie) {
      return res.status(404).json({
        status: 'fail',
        message: `Movie dengan id ${id} tidak ditemukan.`,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Berhasil mengambil data movie dengan id ${id}.`,
      data: movie,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil detail movie.',
      error: error.message,
    });
  }
}

async function getMoviesByAttribute(req, res) {
  try {
    const { attribute, value } = req.params;
    const movies = await movieService.getMoviesByAttribute(attribute, value);

    return res.status(200).json({
      status: 'success',
      message: `Berhasil mengambil data movie berdasarkan ${attribute} = ${value}.`,
      total: movies.length,
      data: movies,
    });
  } catch (error) {
    return res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
}

async function addMovie(req, res) {
  try {
    const newMovie = await movieService.addMovie(req.body || {});
    return res.status(201).json({
      status: 'success',
      message: 'Berhasil menambahkan data movie baru.',
      data: newMovie,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        status: 'fail',
        message: 'Slug movie sudah digunakan. Gunakan judul atau slug yang berbeda.',
      });
    }

    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      status: statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'Gagal menambahkan data movie.',
    });
  }
}

async function updateMovieById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Parameter id harus berupa angka bulat positif.',
      });
    }

    const updatedMovie = await movieService.updateMovieById(id, req.body || {});
    if (!updatedMovie) {
      return res.status(404).json({
        status: 'fail',
        message: `Movie dengan id ${id} tidak ditemukan.`,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Berhasil mengubah data movie dengan id ${id}.`,
      data: updatedMovie,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        status: 'fail',
        message: 'Slug movie sudah digunakan oleh data lain.',
      });
    }

    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      status: statusCode < 500 ? 'fail' : 'error',
      message: error.message || 'Gagal mengubah data movie.',
    });
  }
}

async function deleteMovieById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Parameter id harus berupa angka bulat positif.',
      });
    }

    const deletedMovie = await movieService.deleteMovieById(id);
    if (!deletedMovie) {
      return res.status(404).json({
        status: 'fail',
        message: `Movie dengan id ${id} tidak ditemukan.`,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Berhasil menghapus data movie dengan id ${id}.`,
      data: deletedMovie,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal menghapus data movie.',
      error: error.message,
    });
  }
}

module.exports = {
  getList,
  getAllMovies: getList,
  getMovieById,
  getMoviesByAttribute,
  addMovie,
  updateMovieById,
  deleteMovieById,
};

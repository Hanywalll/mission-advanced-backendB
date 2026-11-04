const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const movieController = require('../controllers/movieController');

const router = express.Router();

// Langkah Keempat & Kelima: Endpoint Get Movie dengan Middleware Autentikasi & Query Params (filter, sort, search)
router.get('/movies', authMiddleware.verifyToken, movieController.getList);
router.get('/movie', authMiddleware.verifyToken, movieController.getList);

// Endpoint CRUD Movie lainnya
router.get('/movie/:id', authMiddleware.verifyToken, movieController.getMovieById);
router.get('/movies/:id', authMiddleware.verifyToken, movieController.getMovieById);
router.get('/movies/attribute/:attribute/:value', authMiddleware.verifyToken, movieController.getMoviesByAttribute);

router.post('/movie', authMiddleware.verifyToken, movieController.addMovie);
router.post('/movies', authMiddleware.verifyToken, movieController.addMovie);

router.patch('/movie/:id', authMiddleware.verifyToken, movieController.updateMovieById);
router.patch('/movies/:id', authMiddleware.verifyToken, movieController.updateMovieById);
router.put('/movie/:id', authMiddleware.verifyToken, movieController.updateMovieById);
router.put('/movies/:id', authMiddleware.verifyToken, movieController.updateMovieById);

router.delete('/movie/:id', authMiddleware.verifyToken, movieController.deleteMovieById);
router.delete('/movies/:id', authMiddleware.verifyToken, movieController.deleteMovieById);

module.exports = router;

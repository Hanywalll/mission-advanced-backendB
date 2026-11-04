const { pool } = require('../config/database');

const ALLOWED_ATTRIBUTES = [
  'title',
  'slug',
  'synopsis',
  'genre',
  'type',
  'release_year',
  'age_rating',
  'poster_url',
  'trailer_url',
  'rating',
  'is_premium',
  'is_published',
];

const ALLOWED_SORT_FIELDS = {
  id: 'id',
  title: 'title',
  genre: 'genre',
  type: 'type',
  release_year: 'release_year',
  releaseyear: 'release_year',
  year: 'release_year',
  rating: 'rating',
  age_rating: 'age_rating',
  created_at: 'created_at',
  updated_at: 'updated_at',
};

function createSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Langkah Kelima: Implementasi Query Params (Filter, Sort, & Search)
 * 1. Filtering menggunakan WHERE (contoh: genre, type, release_year, age_rating, is_premium)
 * 2. Searching menggunakan WHERE dan LIKE (contoh: search berdasarkan title / synopsis)
 * 3. Sorting menggunakan ORDER BY (contoh: sortBy=title, sortBy=rating, sortBy=release_year)
 */
async function getAllMovies(queryParams = {}) {
  let query = 'SELECT * FROM films';
  const conditions = [];
  const params = [];

  // 1. FILTERING menggunakan WHERE
  const genreFilter = queryParams.genre || queryParams.filter;
  if (genreFilter) {
    conditions.push(`(
      genre = ?
      OR id IN (
        SELECT fg.film_id
        FROM film_genres fg
        INNER JOIN genres g ON g.id = fg.genre_id
        WHERE g.name = ? OR g.slug = ?
      )
    )`);
    params.push(genreFilter, genreFilter, String(genreFilter).toLowerCase());
  }

  if (queryParams.type) {
    conditions.push('type = ?');
    params.push(queryParams.type);
  }

  if (queryParams.release_year) {
    conditions.push('release_year = ?');
    params.push(Number(queryParams.release_year));
  }

  if (queryParams.age_rating) {
    conditions.push('age_rating = ?');
    params.push(queryParams.age_rating);
  }

  if (queryParams.is_premium !== undefined) {
    conditions.push('is_premium = ?');
    params.push(queryParams.is_premium === 'true' || queryParams.is_premium === true ? 1 : 0);
  }

  // 3. SEARCHING menggunakan WHERE dan LIKE
  if (queryParams.search) {
    conditions.push('(title LIKE ? OR synopsis LIKE ?)');
    const keyword = `%${queryParams.search}%`;
    params.push(keyword, keyword);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  // 2. SORTING menggunakan ORDER BY
  let sortField = 'id';
  let sortDirection = 'ASC';

  if (queryParams.sortBy) {
    const rawSort = String(queryParams.sortBy).trim();
    const parts = rawSort.split(/[:\s]+/);
    const requestedField = (parts[0] || '').toLowerCase();

    if (ALLOWED_SORT_FIELDS[requestedField]) {
      sortField = ALLOWED_SORT_FIELDS[requestedField];
    }

    if (parts[1] && ['ASC', 'DESC'].includes(parts[1].toUpperCase())) {
      sortDirection = parts[1].toUpperCase();
    }
  }

  const explicitOrder = queryParams.order || queryParams.sortOrder || queryParams.sort;
  if (explicitOrder && ['ASC', 'DESC'].includes(String(explicitOrder).toUpperCase())) {
    sortDirection = String(explicitOrder).toUpperCase();
  }

  query += ` ORDER BY ${sortField} ${sortDirection}`;

  const [rows] = await pool.query(query, params);
  return rows;
}

async function getMovieById(id) {
  const query = 'SELECT * FROM films WHERE id = ?';
  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
}

async function getMoviesByAttribute(attribute, value) {
  if (!ALLOWED_ATTRIBUTES.includes(attribute)) {
    throw new Error(`Atribut "${attribute}" tidak valid untuk pencarian.`);
  }

  const query = `SELECT * FROM films WHERE ${attribute} = ? ORDER BY id ASC`;
  const [rows] = await pool.query(query, [value]);
  return rows;
}

async function addMovie(payload = {}) {
  const isEmptyPayload = !payload || Object.keys(payload).length === 0 || !payload.title;
  const title = isEmptyPayload ? 'Interstellar' : String(payload.title).trim();

  let slug = payload.slug ? createSlug(payload.slug) : createSlug(title);
  if (!slug) {
    slug = `movie-${Date.now()}`;
  }

  const [existingSlug] = await pool.query('SELECT id FROM films WHERE slug = ?', [slug]);
  if (existingSlug.length > 0 && !payload.slug) {
    slug = `${slug}-${Date.now()}`;
  }

  const synopsis =
    payload.synopsis ??
    'Tim penjelajah melakukan perjalanan melalui lubang cacing di luar angkasa dalam upaya untuk memastikan kelangsungan hidup umat manusia.';
  const genre = payload.genre || 'Sci-Fi';
  const type = payload.type === 'series' ? 'series' : 'movie';
  const releaseYear = Number(payload.release_year) || 2014;
  const ageRating = payload.age_rating || '13+';
  const posterUrl = payload.poster_url || `https://images.chill.com/posters/${slug}.jpg`;
  const trailerUrl = payload.trailer_url ?? `https://videos.chill.com/trailers/${slug}.mp4`;
  const rating = payload.rating !== undefined ? Number(payload.rating) : 4.9;
  const isPremium = payload.is_premium !== undefined ? Boolean(payload.is_premium) : true;
  const isPublished = payload.is_published !== undefined ? Boolean(payload.is_published) : true;

  const query = `
    INSERT INTO films (
      title,
      slug,
      synopsis,
      genre,
      type,
      release_year,
      age_rating,
      poster_url,
      trailer_url,
      rating,
      is_premium,
      is_published
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    title,
    slug,
    synopsis,
    genre,
    type,
    releaseYear,
    ageRating,
    posterUrl,
    trailerUrl,
    rating,
    isPremium,
    isPublished,
  ];

  const [result] = await pool.query(query, values);
  return getMovieById(result.insertId);
}

async function updateMovieById(id, payload) {
  const existingMovie = await getMovieById(id);
  if (!existingMovie) {
    return null;
  }

  const setClauses = [];
  const values = [];

  for (const field of ALLOWED_ATTRIBUTES) {
    if (payload[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      if (field === 'is_premium' || field === 'is_published') {
        values.push(Boolean(payload[field]));
      } else if (field === 'release_year' || field === 'rating') {
        values.push(Number(payload[field]));
      } else {
        values.push(payload[field]);
      }
    }
  }

  if (setClauses.length === 0) {
    const error = new Error('Tidak ada field valid yang dikirim untuk diperbarui.');
    error.statusCode = 400;
    throw error;
  }

  values.push(id);
  const query = `UPDATE films SET ${setClauses.join(', ')} WHERE id = ?`;
  await pool.query(query, values);

  return getMovieById(id);
}

async function deleteMovieById(id) {
  const existingMovie = await getMovieById(id);
  if (!existingMovie) {
    return null;
  }

  const query = 'DELETE FROM films WHERE id = ?';
  await pool.query(query, [id]);
  return existingMovie;
}

module.exports = {
  getAllMovies,
  getList: getAllMovies,
  getMovieById,
  getMoviesByAttribute,
  addMovie,
  updateMovieById,
  deleteMovieById,
};

CREATE DATABASE IF NOT EXISTS chill_movie_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE chill_movie_db;

-- ============================================================================
-- Langkah Pertama & Keenam: Entitas User (fullname, username, password, email, token)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    fullname VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    token VARCHAR(255) NULL DEFAULT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url VARCHAR(255) NULL DEFAULT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS packages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    description TEXT NULL,
    price DECIMAL(12, 2) NOT NULL,
    duration_days SMALLINT UNSIGNED NOT NULL,
    max_resolution VARCHAR(20) NOT NULL DEFAULT '1080p',
    max_screens TINYINT UNSIGNED NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_packages PRIMARY KEY (id),
    CONSTRAINT uq_packages_slug UNIQUE (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_code VARCHAR(50) NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    package_id BIGINT UNSIGNED NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    status ENUM('pending', 'paid', 'cancelled', 'expired') NOT NULL DEFAULT 'pending',
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_orders PRIMARY KEY (id),
    CONSTRAINT uq_orders_order_code UNIQUE (order_code),
    CONSTRAINT fk_orders_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_orders_packages FOREIGN KEY (package_id) REFERENCES packages (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    payment_code VARCHAR(50) NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_gateway VARCHAR(50) NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_status ENUM('pending', 'settlement', 'failed', 'refunded', 'expired') NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP NULL,
    payload_response JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_payments PRIMARY KEY (id),
    CONSTRAINT uq_payments_payment_code UNIQUE (payment_code),
    CONSTRAINT fk_payments_orders FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS genres (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_genres PRIMARY KEY (id),
    CONSTRAINT uq_genres_name UNIQUE (name),
    CONSTRAINT uq_genres_slug UNIQUE (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS films (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    synopsis TEXT NOT NULL,
    genre VARCHAR(100) NOT NULL DEFAULT 'Action',
    type ENUM('movie', 'series') NOT NULL DEFAULT 'movie',
    release_year SMALLINT UNSIGNED NOT NULL,
    age_rating VARCHAR(10) NOT NULL DEFAULT '13+',
    poster_url VARCHAR(255) NOT NULL,
    trailer_url VARCHAR(255) NULL,
    rating DECIMAL(3, 1) NOT NULL DEFAULT 0.0,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_films PRIMARY KEY (id),
    CONSTRAINT uq_films_slug UNIQUE (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS film_genres (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    film_id BIGINT UNSIGNED NOT NULL,
    genre_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_film_genres PRIMARY KEY (id),
    CONSTRAINT uq_film_genres_film_genre UNIQUE (film_id, genre_id),
    CONSTRAINT fk_film_genres_films FOREIGN KEY (film_id) REFERENCES films (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_film_genres_genres FOREIGN KEY (genre_id) REFERENCES genres (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS episodes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    film_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    season_number SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    episode_number SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    duration_minutes SMALLINT UNSIGNED NOT NULL,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(255) NULL,
    release_date DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_episodes PRIMARY KEY (id),
    CONSTRAINT uq_episodes_film_season_ep UNIQUE (film_id, season_number, episode_number),
    CONSTRAINT fk_episodes_films FOREIGN KEY (film_id) REFERENCES films (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS my_lists (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    film_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_my_lists PRIMARY KEY (id),
    CONSTRAINT uq_my_lists_user_film UNIQUE (user_id, film_id),
    CONSTRAINT fk_my_lists_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_my_lists_films FOREIGN KEY (film_id) REFERENCES films (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO packages (id, name, slug, description, price, duration_days, max_resolution, max_screens, is_active)
VALUES 
(1, 'Basic', 'basic', 'Kualitas 720p, 1 Layar Aktif', 35000.00, 30, '720p', 1, TRUE),
(2, 'Standard', 'standard', 'Kualitas Full HD 1080p, 2 Layar Aktif', 65000.00, 30, '1080p', 2, TRUE),
(3, 'Premium', 'premium', 'Kualitas Ultra HD 4K + HDR, 4 Layar Aktif', 99000.00, 30, '4K', 4, TRUE);

INSERT IGNORE INTO genres (id, name, slug, description)
VALUES 
(1, 'Action', 'action', 'Film penuh adegan aksi laga menegangkan'),
(2, 'Drama', 'drama', 'Kisah naratif sarat konflik emosional'),
(3, 'Thriller', 'thriller', 'Kisah misteri dengan ketegangan tinggi'),
(4, 'Sci-Fi', 'sci-fi', 'Cerita bertema fiksi ilmiah dan teknologi'),
(5, 'Adventure', 'adventure', 'Petualangan menjelajahi dunia baru');

INSERT IGNORE INTO films (id, title, slug, synopsis, genre, type, release_year, age_rating, poster_url, trailer_url, rating, is_premium, is_published)
VALUES 
(1, 'Happiness', 'happiness', 'Mengisahkan tentang kelompok orang yang berjuang untuk bertahan hidup di dalam sebuah gedung apartemen tertutup saat wabah penyakit menular mematikan melanda kota.', 'Drama', 'series', 2021, '18+', 'https://images.chill.com/posters/happiness.jpg', 'https://videos.chill.com/trailers/happiness.mp4', 4.8, TRUE, TRUE),
(2, 'Alice in Borderland', 'alice-in-borderland', 'Seorang gamer tanpa tujuan dan dua temannya menemukan diri mereka di Tokyo paralel di mana mereka dipaksa bersaing dalam permainan berbahaya untuk bertahan hidup.', 'Sci-Fi', 'series', 2020, '18+', 'https://images.chill.com/posters/alice-in-borderland.jpg', 'https://videos.chill.com/trailers/alice-in-borderland.mp4', 4.5, TRUE, TRUE),
(3, 'The Batman', 'the-batman', 'Ketika seorang pembunuh berantai sadis mulai membunuh tokoh-tokoh politik penting di Gotham, Batman terpaksa menyelidiki korupsi tersembunyi di kota itu.', 'Action', 'movie', 2022, '13+', 'https://images.chill.com/posters/the-batman.jpg', 'https://videos.chill.com/trailers/the-batman.mp4', 4.7, FALSE, TRUE),
(4, 'Spider-Man: Across the Spider-Verse', 'spider-man-across-the-spider-verse', 'Miles Morales melontarkan diri melintasi Multiverse dan bertemu dengan tim Spider-People yang bertugas melindungi keberadaannya.', 'Action', 'movie', 2023, '13+', 'https://images.chill.com/posters/spider-verse.jpg', 'https://videos.chill.com/trailers/spider-verse.mp4', 4.9, TRUE, TRUE),
(5, 'Avatar: The Way of Water', 'avatar-the-way-of-water', 'Jake Sully tinggal bersama keluarga barunya yang terbentuk di planet ekstrasurya Pandora. Ketika ancaman akrab kembali untuk menyelesaikan apa yang sebelumnya dimulai, Jake harus bekerja dengan Neytiri.', 'Adventure', 'movie', 2022, '13+', 'https://images.chill.com/posters/avatar-2.jpg', 'https://videos.chill.com/trailers/avatar-2.mp4', 4.6, FALSE, TRUE);

INSERT IGNORE INTO film_genres (film_id, genre_id)
VALUES 
(1, 2),
(1, 3),
(2, 1),
(2, 3),
(2, 4),
(3, 1),
(3, 3),
(4, 1),
(4, 4),
(4, 5),
(5, 1),
(5, 4),
(5, 5);

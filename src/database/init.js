require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

async function tableExists(connection, database, table) {
  const [rows] = await connection.query(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [database, table]
  );
  return rows.length > 0;
}

async function columnExists(connection, database, table, column) {
  const [rows] = await connection.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [database, table, column]
  );
  return rows.length > 0;
}

async function ensureSchemaMigrations(connection, database) {
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.query(`USE \`${database}\``);

  if (await tableExists(connection, database, 'users')) {
    const hasFullname = await columnExists(connection, database, 'users', 'fullname');
    const hasFullNameOld = await columnExists(connection, database, 'users', 'full_name');
    if (!hasFullname) {
      await connection.query(`ALTER TABLE users ADD COLUMN fullname VARCHAR(100) NOT NULL DEFAULT '' AFTER id`);
      if (hasFullNameOld) {
        await connection.query(`UPDATE users SET fullname = full_name WHERE fullname = ''`);
        await connection.query(`ALTER TABLE users MODIFY COLUMN full_name VARCHAR(100) NOT NULL DEFAULT ''`);
      }
    } else if (hasFullNameOld) {
      await connection.query(`ALTER TABLE users MODIFY COLUMN full_name VARCHAR(100) NOT NULL DEFAULT ''`);
    }

    const hasUsername = await columnExists(connection, database, 'users', 'username');
    if (!hasUsername) {
      await connection.query(`ALTER TABLE users ADD COLUMN username VARCHAR(100) NOT NULL DEFAULT '' AFTER fullname`);
    }

    const hasPassword = await columnExists(connection, database, 'users', 'password');
    const hasPasswordHashOld = await columnExists(connection, database, 'users', 'password_hash');
    if (!hasPassword) {
      await connection.query(`ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '' AFTER email`);
      if (hasPasswordHashOld) {
        await connection.query(`UPDATE users SET password = password_hash WHERE password = ''`);
        await connection.query(`ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT ''`);
      }
    } else if (hasPasswordHashOld) {
      await connection.query(`ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT ''`);
    }

    const hasToken = await columnExists(connection, database, 'users', 'token');
    if (!hasToken) {
      await connection.query(`ALTER TABLE users ADD COLUMN token VARCHAR(255) NULL DEFAULT NULL AFTER password`);
    }

    const hasIsVerified = await columnExists(connection, database, 'users', 'is_verified');
    if (!hasIsVerified) {
      await connection.query(`ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER token`);
    }
  }

  if (await tableExists(connection, database, 'films')) {
    const hasGenre = await columnExists(connection, database, 'films', 'genre');
    if (!hasGenre) {
      await connection.query(`ALTER TABLE films ADD COLUMN genre VARCHAR(100) NOT NULL DEFAULT 'Action' AFTER synopsis`);
    }
    await connection.query(`UPDATE films SET genre = 'Drama' WHERE slug = 'happiness'`);
    await connection.query(`UPDATE films SET genre = 'Sci-Fi' WHERE slug = 'alice-in-borderland'`);
    await connection.query(`UPDATE films SET genre = 'Action' WHERE slug IN ('the-batman', 'spider-man-across-the-spider-verse')`);
    await connection.query(`UPDATE films SET genre = 'Adventure' WHERE slug = 'avatar-the-way-of-water'`);
  }
}

async function initDatabase() {
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    multipleStatements: true,
  });

  try {
    await ensureSchemaMigrations(connection, dbConfig.database);
    await connection.query(sql);
    await ensureSchemaMigrations(connection, dbConfig.database);
    console.log(`Database "${dbConfig.database}" berhasil diinisialisasi dan dimigrasi.`);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  initDatabase().catch((error) => {
    console.error('Gagal menginisialisasi database:', error.message);
    process.exit(1);
  });
}

module.exports = { initDatabase };

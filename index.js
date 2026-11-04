require('dotenv').config({ quiet: true });
const app = require('./src/app');
const { testConnection, dbConfig } = require('./src/config/database');
const { initDatabase } = require('./src/database/init');

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    await initDatabase();
    await testConnection();
    console.log(`Terhubung ke database MySQL "${dbConfig.database}" pada ${dbConfig.host}:${dbConfig.port}`);

    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Gagal terhubung ke database MySQL:', error.message);
    console.error('Pastikan MySQL aktif dan jalankan "npm run db:init" untuk membuat skema database.');
    process.exit(1);
  }
}

startServer();

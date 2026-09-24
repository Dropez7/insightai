// ============================================================
// db.js
// Responsável por criar e exportar o "Pool" de conexões com o
// PostgreSQL. Um Pool gerencia várias conexões simultâneas de
// forma eficiente, reaproveitando conexões já abertas em vez de
// criar uma nova a cada consulta (o que seria muito mais lento).
// ============================================================

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.connect()
  .then((client) => {
    console.log('[db] Conectado ao PostgreSQL com sucesso.');
    client.release();
  })
  .catch((err) => {
    console.error('[db] Falha ao conectar no PostgreSQL:', err.message);
  });
  
module.exports = pool;

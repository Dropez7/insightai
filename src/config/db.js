// ============================================================
// db.js
// Responsável por criar e exportar o "Pool" de conexões com o
// PostgreSQL. Um Pool gerencia várias conexões simultâneas de
// forma eficiente, reaproveitando conexões já abertas em vez de
// criar uma nova a cada consulta (o que seria muito mais lento).
// ============================================================

require('dotenv').config();
const { Pool } = require('pg');

// O Pool lê as credenciais do .env. Cada variável corresponde a
// um dado necessário para o Postgres aceitar a conexão.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Testa a conexão assim que o servidor sobe, só para dar um feedback
// claro no console (facilita muito o debug em fase de aprendizado).
pool.connect()
  .then((client) => {
    console.log('[db] Conectado ao PostgreSQL com sucesso.');
    client.release(); // devolve a conexão ao pool, não fecha o pool inteiro
  })
  .catch((err) => {
    console.error('[db] Falha ao conectar no PostgreSQL:', err.message);
  });

// Exportamos o pool inteiro (e não uma função "query" isolada) para
// que, no futuro, seja fácil evoluir para transações (BEGIN/COMMIT)
// usando pool.connect() quando precisarmos de múltiplas queries atômicas.
module.exports = pool;

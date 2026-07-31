// ============================================================
// userModel.js
//
// Na arquitetura MVC, o "Model" é a única camada que sabe falar
// SQL. Ele não sabe nada sobre HTTP, request, response — apenas
// recebe dados já validados e devolve dados do banco.
// Isso separa "o que o sistema faz com os dados" (Model) de
// "como o sistema conversa com o mundo externo" (Controller/Routes).
// ============================================================

const pool = require('../config/db');

// Cria um novo usuário. A senha já deve chegar aqui como HASH
// (o hashing acontece no controller, antes de chamar o model).
async function create({ name, email, passwordHash }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, passwordHash]
  );
  // pool.query sempre retorna um objeto com "rows" (array de linhas).
  // Como inserimos 1 linha, pegamos a primeira posição.
  return result.rows[0];
}

// Lista todos os usuários (sem expor o password_hash por segurança).
async function findAll() {
  const result = await pool.query(
    `SELECT id, name, email, created_at FROM users ORDER BY id`
  );
  return result.rows;
}

// Busca um usuário pelo ID.
async function findById(id) {
  const result = await pool.query(
    `SELECT id, name, email, created_at FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// Busca um usuário pelo email, incluindo o password_hash.
// Usado internamente no login, para comparar a senha.
async function findByEmailWithPassword(email) {
  const result = await pool.query(
    `SELECT id, name, email, password_hash FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

// Atualiza nome/email de um usuário. Usa COALESCE para permitir
// atualização parcial: se o campo não for enviado (fica undefined/null),
// mantém o valor atual no banco.
async function update(id, { name, email }) {
  const result = await pool.query(
    `UPDATE users
     SET name = COALESCE($1, name),
         email = COALESCE($2, email)
     WHERE id = $3
     RETURNING id, name, email, created_at`,
    [name, email, id]
  );
  return result.rows[0] || null;
}

// Remove um usuário. Graças ao "ON DELETE CASCADE" no schema,
// os projetos e datasets desse usuário são removidos automaticamente
// pelo próprio banco — não precisamos fazer isso manualmente aqui.
async function remove(id) {
  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = {
  create,
  findAll,
  findById,
  findByEmailWithPassword,
  update,
  remove,
};

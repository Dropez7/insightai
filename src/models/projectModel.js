// ============================================================
// projectModel.js
// CRUD de projetos. Todo projeto pertence a um user_id.
// ============================================================

const pool = require('../config/db');

async function create({ userId, name, description }) {
  const result = await pool.query(
    `INSERT INTO projects (user_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, name, description, created_at`,
    [userId, name, description]
  );
  return result.rows[0];
}

// Lista projetos. Se userId for passado, filtra só os daquele usuário
// (isso simula, de forma simples, o isolamento que a Versão 6 -
// Multi-Tenant vai formalizar de verdade com RBAC/JWT).
async function findAll(userId) {
  if (userId) {
    const result = await pool.query(
      `SELECT id, user_id, name, description, created_at
       FROM projects WHERE user_id = $1 ORDER BY id`,
      [userId]
    );
    return result.rows;
  }
  const result = await pool.query(
    `SELECT id, user_id, name, description, created_at FROM projects ORDER BY id`
  );
  return result.rows;
}

async function findById(id) {
  const result = await pool.query(
    `SELECT id, user_id, name, description, created_at FROM projects WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function update(id, { name, description }) {
  const result = await pool.query(
    `UPDATE projects
     SET name = COALESCE($1, name),
         description = COALESCE($2, description)
     WHERE id = $3
     RETURNING id, user_id, name, description, created_at`,
    [name, description, id]
  );
  return result.rows[0] || null;
}

async function remove(id) {
  const result = await pool.query(
    `DELETE FROM projects WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { create, findAll, findById, update, remove };

// ============================================================
// datasetModel.js
// CRUD de datasets. Um dataset pertence a um project_id e guarda
// apenas METADADOS do arquivo (o arquivo em si vive em /uploads,
// no disco — nunca guardamos o binário do arquivo dentro do banco).
// ============================================================

const pool = require('../config/db');

async function create({
  projectId,
  name,
  originalFilename,
  storedFilename,
  filePath,
  sizeBytes,
  mimeType,
}) {
  const result = await pool.query(
    `INSERT INTO datasets
      (project_id, name, original_filename, stored_filename, file_path, size_bytes, mime_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [projectId, name, originalFilename, storedFilename, filePath, sizeBytes, mimeType]
  );
  return result.rows[0];
}

async function findAll(projectId) {
  if (projectId) {
    const result = await pool.query(
      `SELECT * FROM datasets WHERE project_id = $1 ORDER BY id`,
      [projectId]
    );
    return result.rows;
  }
  const result = await pool.query(`SELECT * FROM datasets ORDER BY id`);
  return result.rows;
}

async function findById(id) {
  const result = await pool.query(`SELECT * FROM datasets WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

// Datasets normalmente só têm o "nome de exibição" editado (o arquivo
// em si não é substituído aqui — trocar o arquivo seria um novo upload).
async function update(id, { name }) {
  const result = await pool.query(
    `UPDATE datasets SET name = COALESCE($1, name) WHERE id = $2 RETURNING *`,
    [name, id]
  );
  return result.rows[0] || null;
}

async function remove(id) {
  const result = await pool.query(
    `DELETE FROM datasets WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { create, findAll, findById, update, remove };

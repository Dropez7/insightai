// ============================================================
// datasetModel.js
// CRUD de datasets. Um dataset pertence a um project_id e guarda
// apenas METADADOS do arquivo (o arquivo em si vive em /uploads,
// no disco — nunca guardamos o binário do arquivo dentro do banco).
// ============================================================

const pool = require('../config/db');

async function create({
  projectId, name, originalFilename, storedFilename, filePath, sizeBytes, mimeType, profiling
}) {
  const result = await pool.query(
    `INSERT INTO datasets 
      (project_id, name, original_filename, stored_filename, file_path, size_bytes, mime_type, profiling)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [projectId, name, originalFilename, storedFilename, filePath, sizeBytes, mimeType, profiling]
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

// Datasets normalmente só têm o "nome de exibição" editado (o arquivo em si não é substituído aqui, trocar o arquivo seria um novo upload).
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

// Salva o resultado da análise de IA junto com o timestamp de quando foi gerado. to guardando isso no banco (em vez de recalcular a cada vez que a tela abre) por dois motivos: performance (a interface não fica esperando a IA responder toda vez) e, principalmente, para não desperdiçar as requisições do plano gratuito da Groq (n quero ter q pagar nada aindakkkkkk), só chamamos a IA de novo quando a pessoa pedir explicitamente.
async function saveAiInsights(id, insights) {
  const result = await pool.query(
    `UPDATE datasets
     SET ai_insights = $1, ai_insights_generated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify(insights), id]
  );
  return result.rows[0] || null;
}

// Salva a lista de análises compostas sugeridas pela IA, já com o resultado real de cada uma (calculado pelo queryEngineService) ou o erro, se a execução daquela consulta específica tiver falhado.

// IMPORTANTE: `analyses` é um ARRAY. O driver `pg` serializa objetos JS automaticamente como JSON ao mandar para uma coluna jsonb, mas trata ARRAYS de um jeito diferente — tenta converter para o formato nativo de array do Postgres ("{item1,item2}"), não para JSON. Por isso to usando JSON.stringify explicitamente aqui, em vez de confiar no comportamento automático (que só "funciona por acaso" para objetos simples, como em saveAiInsights acima).
async function saveAiAnalyses(id, analyses) {
  const result = await pool.query(
    `UPDATE datasets
     SET ai_analyses = $1, ai_analyses_generated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify(analyses), id]
  );
  return result.rows[0] || null;
}

module.exports = { create, findAll, findById, update, remove, saveAiInsights, saveAiAnalyses };

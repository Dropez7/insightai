// ============================================================
// aiController.js
//
// Ponte HTTP para o aiService. Repare que este controller não fala
// com a Groq diretamente — ele só busca o dataset (para pegar o
// profiling já salvo), repassa para o aiService, e persiste o
// resultado. A regra "não chama a IA de novo à toa" mora aqui: se já
// existe um profiling salvo, usamos ele; do contrário, orientamos a
// pessoa a fazer upload de novo (datasets antigos, de antes da
// Versão 2, podem não ter profiling salvo).
// ============================================================

const datasetModel = require('../models/datasetModel');
const { generateInsights, suggestAnalyses } = require('../services/aiService');
const { runReadOnlyQuery } = require('../services/queryEngineService');

// POST /api/datasets/:id/ai-insights
async function generateDatasetInsights(req, res, next) {
  try {
    const dataset = await datasetModel.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset não encontrado.' });
    }

    if (!dataset.profiling) {
      return res.status(422).json({
        error:
          'Este dataset não tem um profiling calculado ainda. Isso pode acontecer em datasets enviados antes da Versão 2 — tente reenviar o arquivo.',
      });
    }

    const insights = await generateInsights(dataset.profiling);
    const updated = await datasetModel.saveAiInsights(dataset.id, insights);

    return res.json(updated);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

// POST /api/datasets/:id/ai-analyses
// Gera as sugestões de análises compostas (com SQL) e EXECUTA cada uma de verdade via DuckDB, contra o arquivo real do dataset, a IA nunca é a fonte do número final, só da pergunta e do código.

async function generateDatasetAnalyses(req, res, next) {
  try {
    const dataset = await datasetModel.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset não encontrado.' });
    }

    if (!dataset.profiling) {
      return res.status(422).json({
        error:
          'Este dataset não tem um profiling calculado ainda. Isso pode acontecer em datasets enviados antes da Versão 2 — tente reenviar o arquivo.',
      });
    }

    const suggestions = await suggestAnalyses(dataset.profiling);

    const analysesWithResults = [];
    for (const suggestion of suggestions) {
      const entry = {
        titulo: suggestion.titulo,
        justificativa: suggestion.justificativa,
        sql: suggestion.sql,
      };

      try {
        const { columns, rows } = await runReadOnlyQuery(dataset, suggestion.sql);
        entry.resultado = { columns, rows };
      } catch (queryErr) {
        
        entry.erro = queryErr.message;
      }

      analysesWithResults.push(entry);
    }

    const updated = await datasetModel.saveAiAnalyses(dataset.id, analysesWithResults);
    return res.json(updated);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

module.exports = { generateDatasetInsights, generateDatasetAnalyses };

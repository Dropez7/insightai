// ============================================================
// datasetController.js
//
// Diferente dos outros controllers, esse aqui trabalha em conjunto
// com o middleware "upload" (multer). Quando a rota usa
// upload.single('file'), o multer já rodou ANTES desta função,
// salvou o arquivo em disco, e populou req.file com os metadados.
// ============================================================

const path = require('path');
const fs = require('fs');
const datasetModel = require('../models/datasetModel');

// POST /api/datasets  (multipart/form-data, campo "file")
// Corpo esperado: projectId, name (opcional) + arquivo no campo "file"
async function createDataset(req, res, next) {
  try {
    const { projectId, name } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId é obrigatório.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado (campo "file").' });
    }

    const dataset = await datasetModel.create({
      projectId,
      name: name || req.file.originalname, // se não vier nome, usa o nome original
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      filePath: req.file.path,
      sizeBytes: req.file.size,
      mimeType: req.file.mimetype,
    });

    return res.status(201).json(dataset);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'projectId informado não existe.' });
    }
    next(err);
  }
}

// GET /api/datasets?projectId=123
async function listDatasets(req, res, next) {
  try {
    const { projectId } = req.query;
    const datasets = await datasetModel.findAll(projectId);
    return res.json(datasets);
  } catch (err) {
    next(err);
  }
}

// GET /api/datasets/:id
async function getDataset(req, res, next) {
  try {
    const dataset = await datasetModel.findById(req.params.id);
    if (!dataset) return res.status(404).json({ error: 'Dataset não encontrado.' });
    return res.json(dataset);
  } catch (err) {
    next(err);
  }
}

// PUT /api/datasets/:id -> renomeia o dataset (não troca o arquivo)
async function updateDataset(req, res, next) {
  try {
    const { name } = req.body;
    const dataset = await datasetModel.update(req.params.id, { name });
    if (!dataset) return res.status(404).json({ error: 'Dataset não encontrado.' });
    return res.json(dataset);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/datasets/:id -> remove o registro do banco E o arquivo físico
async function deleteDataset(req, res, next) {
  try {
    const deleted = await datasetModel.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Dataset não encontrado.' });

    // Também removemos o arquivo do disco, para não deixar "lixo" acumulando.
    // Usamos try/catch isolado aqui porque, mesmo se o arquivo já não existir
    // fisicamente, a exclusão no banco já foi bem-sucedida e não deve falhar.
    try {
      if (fs.existsSync(deleted.file_path)) {
        fs.unlinkSync(deleted.file_path);
      }
    } catch (fsErr) {
      console.warn('[datasetController] Não foi possível remover o arquivo físico:', fsErr.message);
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { createDataset, listDatasets, getDataset, updateDataset, deleteDataset };

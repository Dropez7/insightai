const express = require('express');
const router = express.Router();
const datasetController = require('../controllers/datasetController');
const aiController = require('../controllers/aiController');
const { upload } = require('../middlewares/upload');

// upload.single('file') roda ANTES do controller: intercepta o
// multipart/form-data, salva o arquivo em disco e popula req.file.
router.post('/', upload.single('file'), datasetController.createDataset);
router.get('/', datasetController.listDatasets);        // ?projectId=123 (opcional)
router.get('/:id', datasetController.getDataset);
router.put('/:id', datasetController.updateDataset);
router.delete('/:id', datasetController.deleteDataset);

// Versão 3 (IA): gera (ou regenera) a leitura interpretativa do
// profiling já salvo. É um POST porque tem efeito colateral (chama
// um serviço externo e grava no banco) — não é uma simples leitura.
router.post('/:id/ai-insights', aiController.generateDatasetInsights);

module.exports = router;

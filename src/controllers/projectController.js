// ============================================================
// projectController.js
// CRUD de projetos. Repara que a validação de "o projeto existe?"
// fica aqui (camada de aplicação), enquanto o "como buscar no banco"
// fica no model. Essa separação facilita trocar o banco no futuro
// sem precisar tocar nessa camada.
// ============================================================

const projectModel = require('../models/projectModel');

// POST /api/projects
async function createProject(req, res, next) {
  try {
    const { userId, name, description } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ error: 'userId e name são obrigatórios.' });
    }
    const project = await projectModel.create({ userId, name, description });
    return res.status(201).json(project);
  } catch (err) {
    // 23503 = violação de FOREIGN KEY (userId que não existe)
    if (err.code === '23503') {
      return res.status(400).json({ error: 'userId informado não existe.' });
    }
    next(err);
  }
}

// GET /api/projects?userId=123 -> lista (opcionalmente filtrando por dono)
async function listProjects(req, res, next) {
  try {
    const { userId } = req.query;
    const projects = await projectModel.findAll(userId);
    return res.json(projects);
  } catch (err) {
    next(err);
  }
}

// GET /api/projects/:id
async function getProject(req, res, next) {
  try {
    const project = await projectModel.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });
    return res.json(project);
  } catch (err) {
    next(err);
  }
}

// PUT /api/projects/:id
async function updateProject(req, res, next) {
  try {
    const { name, description } = req.body;
    const project = await projectModel.update(req.params.id, { name, description });
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });
    return res.json(project);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/projects/:id
async function deleteProject(req, res, next) {
  try {
    const deleted = await projectModel.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Projeto não encontrado.' });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { createProject, listProjects, getProject, updateProject, deleteProject };

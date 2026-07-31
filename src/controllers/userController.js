// ============================================================
// userController.js
//
// O "Controller" é a ponte entre o mundo HTTP (req/res) e o Model.
// Responsabilidades dele:
//   1. Ler dados da requisição (req.body, req.params)
//   2. Validar/transformar esses dados (ex: gerar hash da senha)
//   3. Chamar o Model
//   4. Formatar a resposta (status HTTP + JSON)
// O Controller NUNCA deveria conter SQL diretamente.
// ============================================================

const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

const SALT_ROUNDS = 10; // "custo" do hash — quanto maior, mais seguro e mais lento

// POST /api/users -> cria um novo usuário (cadastro)
async function createUser(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email e password são obrigatórios.' });
    }

    // Nunca guardamos a senha em texto puro. O bcrypt gera um hash
    // que inclui o "salt" (dado aleatório) embutido no próprio hash,
    // então não precisamos guardar o salt separadamente.
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await userModel.create({ name, email, passwordHash });
    return res.status(201).json(user);
  } catch (err) {
    // Código 23505 = violação de UNIQUE no Postgres (email duplicado)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Já existe um usuário com esse email.' });
    }
    next(err); // delega para o middleware de erro central
  }
}

// GET /api/users -> lista todos os usuários
async function listUsers(req, res, next) {
  try {
    const users = await userModel.findAll();
    return res.json(users);
  } catch (err) {
    next(err);
  }
}

// GET /api/users/:id -> busca um usuário específico
async function getUser(req, res, next) {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    return res.json(user);
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/:id -> atualiza nome/email
async function updateUser(req, res, next) {
  try {
    const { name, email } = req.body;
    const user = await userModel.update(req.params.id, { name, email });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    return res.json(user);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/users/:id
async function deleteUser(req, res, next) {
  try {
    const deleted = await userModel.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Usuário não encontrado.' });
    return res.status(204).send(); // 204 = sucesso, sem conteúdo pra devolver
  } catch (err) {
    next(err);
  }
}

// POST /api/users/login -> login simples (SEM emissão de JWT ainda —
// isso fica reservado para a Versão 5/IAM). Aqui só validamos a senha
// e devolvemos os dados públicos do usuário, para você já entender o
// fluxo de comparação de hash antes de complicar com tokens.
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email e password são obrigatórios.' });
    }

    const user = await userModel.findByEmailWithPassword(email);
    if (!user) {
      // Propositalmente não dizemos "email não existe" para não
      // dar pistas a quem está tentando adivinhar contas válidas.
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    return res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    next(err);
  }
}

module.exports = { createUser, listUsers, getUser, updateUser, deleteUser, login };

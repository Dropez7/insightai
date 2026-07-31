// ============================================================
// server.js
//
// Ponto de entrada da aplicação. Aqui montamos o "esqueleto":
//   - middlewares globais (JSON parser, CORS)
//   - as rotas de cada recurso (users, projects, datasets)
//   - o middleware de erro (sempre por ÚLTIMO)
//   - o start do servidor HTTP
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const datasetRoutes = require('./routes/datasetRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// --- Middlewares globais ---
app.use(cors());          // permite que o futuro frontend (React) chame essa API
app.use(express.json());  // faz o parse automático de corpos JSON (req.body)

// --- Rota de health-check ---
// Útil para o Docker/monitoramento saberem se a API está de pé.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'insightai-backend' });
});

// --- Registro das rotas de cada recurso ---
// Cada recurso vira um "prefixo" de URL:
//   /api/users/...
//   /api/projects/...
//   /api/datasets/...
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/datasets', datasetRoutes);

// --- Middleware de erro (deve ser o ÚLTIMO app.use) ---
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[server] InsightAI backend rodando na porta ${PORT}`);
});

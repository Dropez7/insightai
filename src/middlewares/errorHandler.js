// ============================================================
// errorHandler.js
//
// Middleware de erro do Express (reconhecido por ter 4 argumentos:
// err, req, res, next). Quando qualquer controller chama next(err),
// a requisição "pula" direto para cá, evitando duplicar blocos de
// tratamento de erro em cada rota.
// ============================================================

function errorHandler(err, req, res, next) {
  console.error('[errorHandler]', err);

  if (err.message && err.message.includes('não suportado')) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({
    error: 'Erro interno no servidor.',
    // exposto pois ainda estou em dev 
    detail: err.message,
  });
}

module.exports = errorHandler;

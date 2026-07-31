// ============================================================
// upload.js
//
// Configura o Multer, biblioteca que intercepta requisições
// "multipart/form-data" (usadas para enviar arquivos) e salva o
// arquivo em disco ANTES do controller ser executado.
// Depois disso, o controller recebe o arquivo já pronto em req.file.
// ============================================================

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Garante que a pasta de uploads existe (evita erro na primeira execução)
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// "storage" define ONDE e COM QUE NOME o arquivo será salvo em disco.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Geramos um nome único (timestamp + nome original) para nunca
    // sobrescrever um arquivo já existente com o mesmo nome.
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

// Aceita apenas CSV, JSON e Excel (alinhado com a leitura automática
// planejada para a Versão 2 - Engenharia de Dados).
function fileFilter(req, file, cb) {
  const allowedExtensions = ['.csv', '.json', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Use CSV, JSON ou Excel.'));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // limite de 50MB por arquivo
});

module.exports = { upload, UPLOAD_DIR };

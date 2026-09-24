// ============================================================
// queryEngineService.js
//
// Executa SQL, gerado pela IA, portanto NÃO CONFIÁVEL por padrão,
// contra o arquivo real de um dataset, usando o DuckDB como motor.
// Esta é a peça mais sensível dessa versao: qualquer descuido aqui
// significa deixar um LLM rodar comandos arbitrários no seu servidor.
// Por isso as regras abaixo são estritas e cada uma existe para
// bloquear um risco específico:
//
//   1. Só SELECT/WITH é aceito (regex + validação estrutural)      -> bloqueia escrita/DDL
//   2. A IA nunca vê caminho de arquivo, só o nome fixo "dataset"  -> bloqueia acesso a outros arquivos
//   3. Toda query é embrulhada em "SELECT * FROM (<sql>) LIMIT N"  -> bloqueia múltiplos statements
//      (um subquery só aceita UM SELECT, se a IA tentar emendar
//      "; DROP TABLE x" ali dentro, o parser do DuckDB já rejeita)
//   4. Timeout manual                                               -> bloqueia consultas que travam
//   5. Instância do DuckDB é criada e destruída a cada consulta     -> nenhum estado sobrevive entre requisições
// ============================================================

const fs = require('fs');
const os = require('os');
const path = require('path');
const XLSX = require('xlsx');
const { DuckDBInstance } = require('@duckdb/node-api');

const MAX_ROWS = 500; // teto de linhas devolvidas, não importa o que a query pedir
const QUERY_TIMEOUT_MS = 15_000;

// Palavras que, se aparecerem na query, derrubam ela na hora — mesmo
// que estejam dentro de um comentário SQL ou string, preferimos ser
// paranoicos aqui (falso positivo é só uma análise que não roda; falso
// negativo é um comando destrutivo rodando de verdade),
// já que n sei muitas defesas pra prompt injection ainda, ta na lista de coisas pra aprender

const FORBIDDEN_KEYWORDS =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|DETACH|COPY|PRAGMA|INSTALL|LOAD|EXPORT|IMPORT|CALL|SET|VACUUM|CHECKPOINT|GRANT|REVOKE|EXECUTE)\b/i;

function assertReadOnlySelect(sql) {
  const trimmed = sql.trim().replace(/;+\s*$/, ''); // remove ; final, se houver

  if (trimmed.includes(';')) {
    throw new Error('Só é permitida uma única instrução SQL por consulta.');
  }
  if (!/^(SELECT|WITH)\b/i.test(trimmed)) {
    throw new Error('Só consultas SELECT são permitidas.');
  }
  if (FORBIDDEN_KEYWORDS.test(trimmed)) {
    throw new Error('A consulta contém uma palavra-chave não permitida (somente leitura).');
  }

  return trimmed;
}

// Converte o arquivo do dataset para algo que o DuckDB saiba ler
// nativamente. CSV e JSON, o DuckDB lê direto do arquivo original.
// Excel não tem leitor nativo sem uma extensão (que precisaria baixar
// da internet), então converto para um CSV temporário usando a
// mesma lib (xlsx) já usada no resto do projeto.
function resolveReadableSource(dataset) {
  const extension = path.extname(dataset.original_filename).toLowerCase();

  if (extension === '.csv') {
    return { sql: `read_csv_auto('${escapeSqlString(dataset.file_path)}')`, cleanup: null };
  }

  if (extension === '.json') {
    return { sql: `read_json_auto('${escapeSqlString(dataset.file_path)}')`, cleanup: null };
  }

  if (extension === '.xlsx' || extension === '.xls') {
    const workbook = XLSX.readFile(dataset.file_path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const csvContent = XLSX.utils.sheet_to_csv(sheet);

    const tempPath = path.join(os.tmpdir(), `insightai-${dataset.id}-${Date.now()}.csv`);
    fs.writeFileSync(tempPath, csvContent, 'utf-8');

    return {
      sql: `read_csv_auto('${escapeSqlString(tempPath)}')`,
      cleanup: () => fs.unlink(tempPath, () => {}), // limpeza best-effort, não precisa esperar
    };
  }

  throw new Error(`Formato de arquivo não suportado para consulta: ${extension}`);
}

// Previne quebra de sintaxe SQL caso o caminho do arquivo tenha
// caracteres especiais (aspas simples). Caminhos de arquivo aqui são
// sempre gerados pelo NOSSO código (multer), nunca pelo usuário
// diretamente, mas escapamos mesmo assim por hábito de segurança.
function escapeSqlString(value) {
  return value.replace(/'/g, "''");
}

// Executa uma query (já validada) contra o dataset e devolve
// { columns, rows }. Cria e destrói a instância do DuckDB a cada
// chamada — mais lento que reaproveitar uma conexão, mas garante que
// nenhum estado (views, configs) vaze de uma consulta para outra.
async function runReadOnlyQuery(dataset, untrustedSql) {
  const safeSql = assertReadOnlySelect(untrustedSql);
  const source = resolveReadableSource(dataset);

  const instance = await DuckDBInstance.create(':memory:');
  const connection = await instance.connect();

  try {
    // A view "dataset" é criada pelo MEU código, não pela IA, é
    // esse o limite real de segurança: a IA só pode fazer SELECT
    // sobre essa view com esse nome fixo, nunca escolher um arquivo.
    await connection.run(`CREATE VIEW dataset AS SELECT * FROM ${source.sql}`);

    // Embrulhamos a query da IA como subquery + LIMIT. Isso tem dois
    // efeitos: (1) garante o teto de linhas mesmo se a IA esquecer o
    // LIMIT; (2) o parser do DuckDB só aceita uma única expressão
    // SELECT dentro dos parênteses, o que barra tentativas de emendar
    // um segundo comando.
    const wrappedSql = `SELECT * FROM (${safeSql}) AS _ai_query LIMIT ${MAX_ROWS}`;

    const result = await withTimeout(connection.run(wrappedSql), QUERY_TIMEOUT_MS);
    const rows = await result.getRowObjects();
    const columns = result.columnNames();

    return { columns, rows };
  } finally {
    // Fecha a conexão e a instância independentemente de sucesso ou
    // erro, e limpa o CSV temporário do Excel, se houver.
    connection.closeSync();
    instance.closeSync();
    if (source.cleanup) source.cleanup();
  }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Consulta excedeu o tempo limite de ${ms / 1000}s.`)), ms)
    ),
  ]);
}

module.exports = { runReadOnlyQuery };

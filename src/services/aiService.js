// ============================================================
// aiService.js

// Duas responsabilidades relacionadas, ambas partindo do mesmo
// PROFILING (nunca do dataset bruto):

//   generateInsights(profiling)
//     -> leitura interpretativa em texto (resumo, problemas, insights)

//   suggestAnalyses(profiling)
//     -> propõe de 3 a 5 perguntas analíticas de alto valor PARA ESTE
//       dataset específico, cada uma já com o SQL (dialeto DuckDB)
//       para responder, a IA aqui NÃO calcula
//       a resposta, ela só propõe a pergunta e o código. Quem
//       calcula de verdade é o queryEngineService, rodando o SQL
//       contra o arquivo real. Isso existe para não confiarmos em
//       números que a IA possa ter "chutado", era um dos meus medos, 
//       vai que a IA alucina, mas isso agora ta mitigado

// Por que mandamos o profiling e não o dataset bruto?
//   1. Custo/limite: a Groq tem um limite de TOKENS por minuto no
//      plano gratuito. Um dataset com 50 mil linhas facilmente
//      estouraria esse limite (n tenho dinheiro pra pagar); um profiling (resumo estatístico)
//      tem um tamanho praticamente fixo, não importa se o dataset
//      original tem 100 ou 1 milhão de linhas.
//   2. Privacidade: os dados brutos do usuário nunca saem do nosso
//      servidor rumo a um serviço terceiro, só um RESUMO estatístico
//      sai. Isso é uma escolha de design deliberada, principalmente por segurança e privacidade.
//   3. É exatamente o trabalho que um analista de dados faria: olhar
//      para as estatísticas primeiro, não para cada linha individual.
// ============================================================

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// openai/gpt-oss-120b é o modelo recomendado atualmente pela própria
// Groq (llama-3.3-70b-versatile, mais citado por aí, está sendo
// desativado por eles em 16/08/2026). deixei configurável via env
// para não precisar mexer em código se isso mudar de novo no futuro.
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

// Monta o payload de profiling exatamente com o que a IA precisa,
// removendo o "preview" (amostra de linhas). Isso é reforço extra:
// mesmo que o preview esteja no objeto que o controller tem em mãos,
// o service de IA nunca vê essas linhas.
function buildProfilingPayload(profiling) {
  const { geral, colunas } = profiling;
  return { geral, colunas };
}

// Função de baixo nível compartilhada: manda um system+user prompt
// para a Groq, força modo JSON, e trata os erros comuns (chave
// ausente, rate limit, resposta malformada) de um jeito consistente
// para as duas funções públicas deste service.
async function callGroq(systemPrompt, userContent) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const err = new Error(
      'GROQ_API_KEY não configurada no servidor. Veja o arquivo IA_EXPLICACAO.md para instruções de como obter e configurar a chave gratuita.'
    );
    err.status = 500;
    throw err;
  }

  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3, // baixa: queremos leitura consistente dos números, não criatividade
      response_format: { type: 'json_object' }, // força a Groq a devolver um JSON válido
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    // 429 = estourou o limite de requisições do plano gratuito. Vale a
    // pena tratar separado, porque a mensagem certa é "espera um
    // pouco", não "algo quebrou".
    if (response.status === 429) {
      const err = new Error(
        'Limite de requisições gratuitas da Groq atingido no momento. Aguarde um minuto e tente novamente.'
      );
      err.status = 429;
      throw err;
    }

    const err = new Error(
      `Falha ao consultar a IA (Groq respondeu ${response.status}): ${errorBody?.error?.message || 'erro desconhecido'}`
    );
    err.status = 502; // Bad Gateway: meu servidor depende de um serviço externo que falhou
    throw err;
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;

  if (!rawContent) {
    const err = new Error('A IA respondeu sem conteúdo utilizável.');
    err.status = 502;
    throw err;
  }

  try {
    return JSON.parse(rawContent);
  } catch {
    const err = new Error('A IA respondeu em um formato inesperado (JSON inválido).');
    err.status = 502;
    throw err;
  }
}

// prompt de insigths
const INSIGHTS_SYSTEM_PROMPT = `Você é um analista de dados sênior. Você recebe um PERFIL ESTATÍSTICO
(profiling) de um dataset — nunca os dados brutos — e deve produzir uma leitura
interpretativa desse perfil, em português do Brasil.

Responda SOMENTE com um JSON válido, sem markdown, sem texto antes ou depois, seguindo
exatamente este formato:

{
  "resumo": "2 a 4 frases resumindo o que esse dataset parece representar e seu estado geral",
  "metricas_principais": ["3 a 5 métricas ou números que mais chamam atenção no profiling"],
  "problemas_encontrados": ["problemas de qualidade de dados: nulos altos, duplicatas, outliers, tipos inconsistentes etc. Se não houver problemas relevantes, retorne um array vazio"],
  "insights": ["3 a 5 observações interpretativas sobre o que os números sugerem"],
  "possiveis_correlacoes": ["hipóteses de relação entre colunas, baseadas na matriz de correlação e nos nomes das colunas — deixe claro que são hipóteses a validar, não conclusões"],
  "recomendacoes": ["2 a 4 próximos passos práticos de limpeza ou investigação dos dados"]
}

Seja específico e cite nomes de colunas e números reais do profiling recebido. Nunca invente
dados que não estejam no profiling. Se o profiling tiver poucas colunas numéricas ou nenhuma
correlação calculável, diga isso explicitamente em vez de inventar.`;

async function generateInsights(profiling) {
  const payload = buildProfilingPayload(profiling);
  return callGroq(INSIGHTS_SYSTEM_PROMPT, `Profiling do dataset:\n${JSON.stringify(payload)}`);
}

// Sugestão de análises compostas + SQL 

const ANALYSES_SYSTEM_PROMPT = `Você é um analista de dados sênior especializado em SQL analítico
(dialeto DuckDB). Você recebe um PERFIL ESTATÍSTICO (profiling: nomes de colunas, tipos,
contagem de nulos, estatísticas, valores mais comuns) de um dataset — nunca os dados brutos.

Sua tarefa é propor as análises COMPOSTAS mais valiosas e com maior ganho de informação para
ESTE dataset específico — o tipo de pergunta que um analista humano faria olhando para essas
colunas (ex: "qual categoria tem a melhor média?", "existe relação entre X e Y?", "como Z se
distribui por W?"). Priorize perguntas que cruzam pelo menos duas colunas (agrupamento,
comparação, proporção) — não repita métricas simples que o profiling já mostra sozinho
(como "quantas linhas tem" ou "qual o valor máximo de uma coluna").

Para cada análise proposta, escreva o SQL que a responde, seguindo TODAS estas regras:
- Dialeto DuckDB.
- A única tabela disponível se chama exatamente "dataset" (sem aspas na cláusula FROM: FROM dataset).
- Use aspas duplas ao redor de nomes de colunas sempre que o nome não for um identificador
  simples (tiver espaço, acento, maiúsculas ou caractere especial) — ex: "Nome da Coluna".
- Apenas SELECT (pode usar WITH/CTE). Nunca gere INSERT, UPDATE, DELETE, DROP, ALTER, CREATE,
  ATTACH ou qualquer comando que não seja leitura.
- Use apenas os nomes de coluna que aparecem no profiling recebido — nunca invente colunas.
- Prefira incluir um LIMIT razoável (ex: 20) quando o resultado esperado for uma lista/ranking.
- Não gere ponto-e-vírgula no final.

Responda SOMENTE com um JSON válido, sem markdown, sem texto antes ou depois, seguindo
exatamente este formato:

{
  "analises": [
    {
      "titulo": "título curto da análise, ex: 'Categoria com melhor avaliação média'",
      "justificativa": "1 a 2 frases explicando por que essa análise é valiosa / o que ela revela",
      "sql": "SELECT ... FROM dataset ..."
    }
  ]
}

Proponha entre 3 e 5 análises. Se o dataset tiver poucas colunas ou pouca diversidade para
cruzamentos interessantes, proponha menos análises (nunca invente colunas para completar o
número) e diga isso na justificativa.`;

async function suggestAnalyses(profiling) {
  const payload = buildProfilingPayload(profiling);
  const result = await callGroq(ANALYSES_SYSTEM_PROMPT, `Profiling do dataset:\n${JSON.stringify(payload)}`);

  // Aceita tanto { "analises": [...] } (formato pedido) quanto, por
  // segurança, um array solto — alguns modelos ocasionalmente ignoram
  // o "wrapper" do objeto mesmo em modo JSON.
  const list = Array.isArray(result) ? result : result.analises;

  if (!Array.isArray(list)) {
    const err = new Error('A IA não retornou uma lista de análises no formato esperado.');
    err.status = 502;
    throw err;
  }

  return list;
}

module.exports = { generateInsights, suggestAnalyses };

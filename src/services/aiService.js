// ============================================================
// aiService.js
//
// Responsabilidade única: pegar um PROFILING já calculado (não o
// dataset inteiro!) e mandar para um modelo de linguagem gratuito
// (via Groq) pedindo uma leitura interpretativa dele — resumo,
// problemas, insights, possíveis correlações, recomendações.
//
// Por que mandamos o profiling e não o dataset bruto?
//   1. Custo/limite: a Groq tem um limite de TOKENS por minuto no
//      plano gratuito. Um dataset com 50 mil linhas facilmente
//      estouraria esse limite; um profiling (resumo estatístico)
//      tem um tamanho praticamente fixo, não importa se o dataset
//      original tem 100 ou 1 milhão de linhas.
//   2. Privacidade: os dados brutos do usuário nunca saem do nosso
//      servidor rumo a um serviço terceiro — só um RESUMO estatístico
//      sai. Isso é uma escolha de design deliberada.
//   3. É exatamente o trabalho que um analista de dados faria: olhar
//      para as estatísticas primeiro, não para cada linha individual.
//
// O agente mais sofisticado do roadmap (Versão 4, integrado a
// ferramentas como Metabase) vai precisar ver dados de verdade para
// responder perguntas específicas ("quais os filmes mais bem
// avaliados?") — esse aqui NÃO é esse agente. Esse é o mais simples
// possível: interpretação estatística genérica, sem acesso aos dados.
// ============================================================

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// openai/gpt-oss-120b é o modelo recomendado atualmente pela própria
// Groq (llama-3.3-70b-versatile, mais citado por aí, está sendo
// desativado por eles em 16/08/2026). Deixamos configurável via env
// para não precisar mexer em código se isso mudar de novo no futuro.
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

const SYSTEM_PROMPT = `Você é um analista de dados sênior. Você recebe um PERFIL ESTATÍSTICO
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

// Monta o payload de profiling exatamente com o que a IA precisa,
// removendo o "preview" (amostra de linhas). Isso é reforço extra:
// mesmo que o preview esteja no objeto que o controller tem em mãos,
// o service de IA nunca vê essas linhas.
function buildProfilingPayload(profiling) {
  const { geral, colunas } = profiling;
  return { geral, colunas };
}

async function generateInsights(profiling) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const err = new Error(
      'GROQ_API_KEY não configurada no servidor. Veja o arquivo IA_EXPLICACAO.md para instruções de como obter e configurar a chave gratuita.'
    );
    err.status = 500;
    throw err;
  }

  const profilingPayload = buildProfilingPayload(profiling);
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
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Profiling do dataset:\n${JSON.stringify(profilingPayload)}` },
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
    err.status = 502; // Bad Gateway: nosso servidor depende de um serviço externo que falhou
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

module.exports = { generateInsights };

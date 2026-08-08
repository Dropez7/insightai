// ============================================================
// AiInsightsPanel.jsx
//
// Mostra a leitura interpretativa gerada pela IA (resumo, métricas,
// problemas, insights, correlações hipotéticas, recomendações) ou,
// se ainda não existir, um convite para gerá-la. Não chama a IA
// sozinho ao montar — só quando a pessoa clica no botão — para não
// gastar requisições do plano gratuito sem a pessoa pedir.
// ============================================================

import { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';

export default function AiInsightsPanel({ datasetId, initialInsights, initialGeneratedAt, onGenerate }) {
  const [insights, setInsights] = useState(initialInsights || null);
  const [generatedAt, setGeneratedAt] = useState(initialGeneratedAt || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setIsLoading(true);
    setError('');
    try {
      const updated = await onGenerate(datasetId);
      setInsights(updated.ai_insights);
      setGeneratedAt(updated.ai_insights_generated_at);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="ai-panel">
      <div className="ai-panel-header">
        <div>
          <h3 className="ai-panel-title">
            <Sparkles size={17} strokeWidth={1.75} />
            Análise por IA
          </h3>
          {generatedAt && (
            <span className="eyebrow">
              gerado em {new Date(generatedAt).toLocaleString('pt-BR')}
            </span>
          )}
        </div>

        <button className="btn btn-ghost" onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? (
            'Analisando…'
          ) : (
            <>
              <RefreshCw size={14} />
              {insights ? 'Gerar novamente' : 'Gerar análise com IA'}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="ai-panel-error">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      {!insights && !isLoading && !error && (
        <p className="ai-panel-empty">
          Peça para a IA ler o perfil estatístico deste dataset e te dar um resumo, possíveis
          problemas e recomendações. Isso não envia seus dados brutos para fora — só o profiling
          (números já calculados).
        </p>
      )}

      {isLoading && <p className="ai-panel-empty">A IA está lendo o profiling deste dataset…</p>}

      {insights && !isLoading && (
        <div className="ai-panel-content">
          <p className="ai-panel-summary">{insights.resumo}</p>

          <InsightBlock title="Métricas principais" items={insights.metricas_principais} tone="neutral" />
          <InsightBlock title="Problemas encontrados" items={insights.problemas_encontrados} tone="danger" />
          <InsightBlock title="Insights" items={insights.insights} tone="accent" />
          <InsightBlock
            title="Possíveis correlações (hipóteses)"
            items={insights.possiveis_correlacoes}
            tone="neutral"
          />
          <InsightBlock title="Recomendações" items={insights.recomendacoes} tone="accent-2" />
        </div>
      )}
    </section>
  );
}

function InsightBlock({ title, items, tone }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="ai-block">
      <span className="eyebrow">{title}</span>
      <ul className={`ai-list ai-list-${tone}`}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

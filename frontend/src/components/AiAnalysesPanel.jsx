// ============================================================
// AiAnalysesPanel.jsx
//
// Mostra as análises compostas sugeridas pela IA — cada uma com um
// título, a justificativa (por que vale a pena olhar isso), o SQL
// gerado (escondido por padrão, mas sempre disponível — transparência
// total sobre o que rodou) e o RESULTADO REAL daquela consulta,
// executada de verdade pelo motor DuckDB no backend.
//
// Importante: se uma análise específica falhou ao executar (SQL
// inválido, coluna que não existe etc.), mostramos o erro em vez de
// esconder ou fingir que deu certo — a transparência aqui é uma
// escolha deliberada, não um descuido.
// ============================================================

import { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AiAnalysesPanel({ datasetId, initialAnalyses, initialGeneratedAt, onGenerate }) {
  const [analyses, setAnalyses] = useState(initialAnalyses || null);
  const [generatedAt, setGeneratedAt] = useState(initialGeneratedAt || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setIsLoading(true);
    setError('');
    try {
      const updated = await onGenerate(datasetId);
      setAnalyses(updated.ai_analyses);
      setGeneratedAt(updated.ai_analyses_generated_at);
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
            Análises compostas sugeridas
          </h3>
          {generatedAt && (
            <span className="eyebrow">gerado em {new Date(generatedAt).toLocaleString('pt-BR')}</span>
          )}
        </div>

        <button className="btn btn-ghost" onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? (
            'Analisando…'
          ) : (
            <>
              <RefreshCw size={14} />
              {analyses ? 'Gerar novamente' : 'Sugerir análises com IA'}
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

      {!analyses && !isLoading && !error && (
        <p className="ai-panel-empty">
          A IA vai olhar o perfil deste dataset e propor as perguntas mais valiosas para cruzar —
          tipo "qual categoria tem a melhor média?". Cada sugestão vem com o SQL usado, e o
          resultado é sempre calculado de verdade (via DuckDB) em cima do seu arquivo — a IA nunca
          inventa o número final.
        </p>
      )}

      {isLoading && <p className="ai-panel-empty">A IA está propondo análises e executando cada uma…</p>}

      {analyses && !isLoading && (
        <div className="ai-panel-content">
          {analyses.length === 0 && (
            <p className="ai-panel-empty">A IA não encontrou cruzamentos valiosos para sugerir neste dataset.</p>
          )}
          {analyses.map((analysis, i) => (
            <AnalysisCard key={i} analysis={analysis} />
          ))}
        </div>
      )}
    </section>
  );
}

function AnalysisCard({ analysis }) {
  const [showSql, setShowSql] = useState(false);
  const { titulo, justificativa, sql, resultado, erro } = analysis;

  // Um resultado com exatamente 2 colunas, onde a segunda é numérica,
  // renderiza bem como gráfico de barras (ex: categoria x contagem/média).
  // Qualquer outro formato cai para a tabela genérica, que sempre funciona.
  const canChart =
    resultado &&
    resultado.columns.length === 2 &&
    resultado.rows.length > 0 &&
    resultado.rows.every((r) => !isNaN(Number(r[resultado.columns[1]])));

  return (
    <div className="analysis-card">
      <div className="analysis-card-header">
        <h4>{titulo}</h4>
        <p className="text-muted">{justificativa}</p>
      </div>

      <button className="analysis-sql-toggle" onClick={() => setShowSql((v) => !v)}>
        {showSql ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        Ver SQL gerado
      </button>
      {showSql && <pre className="analysis-sql mono">{sql}</pre>}

      {erro && (
        <div className="ai-panel-error">
          <AlertTriangle size={15} />
          Não foi possível executar esta análise: {erro}
        </div>
      )}

      {resultado && canChart && (
        <div style={{ height: 220, marginTop: 'var(--space-3)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={resultado.rows} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <XAxis
                dataKey={resultado.columns[0]}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'var(--surface-raised)' }}
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)' }}
                itemStyle={{ color: 'var(--accent)' }}
              />
              <Bar dataKey={resultado.columns[1]} fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {resultado && !canChart && (
        <div style={{ overflowX: 'auto', marginTop: 'var(--space-3)' }}>
          <table className="dataset-table" style={{ whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                {resultado.columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resultado.rows.map((row, i) => (
                <tr key={i}>
                  {resultado.columns.map((col) => (
                    <td key={col}>{String(row[col] ?? '—')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

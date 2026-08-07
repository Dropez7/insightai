import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Topbar from '../components/Topbar';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DatasetPage() {
  const { id } = useParams();
  const { show } = useToast();
  const [dataset, setDataset] = useState(null);

  useEffect(() => {
    api.datasets.get(id)
      .then(setDataset)
      .catch(err => show(err.message, 'danger'));
  }, [id]);

  if (!dataset) return <Topbar title="Carregando..." />;

  const { profiling } = dataset;

  return (
    <>
      <Topbar
        title={dataset.name}
        breadcrumb={
          <Link to={`/projects/${dataset.project_id}`} className="topbar-back">
            <ArrowLeft size={13} /> Voltar ao Projeto
          </Link>
        }
      />
      <div className="app-content">
        {!profiling ? (
          <p>Nenhuma análise disponível.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Visão Geral */}
            <section>
              <h3>Visão Geral</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginTop: '16px' }}>
                <Card label="Linhas" value={profiling.geral.rowCount} />
                <Card label="Colunas" value={profiling.geral.columnCount} />
                <Card label="Valores Totais" value={profiling.geral.totalValores} />
                <Card label="Valores Nulos" value={profiling.geral.totalNulls} />
                <Card label="Duplicatas" value={profiling.geral.duplicateCount} />
              </div>
            </section>

            {/* Perfil das Colunas */}
            <section>
              <h3>Perfil das Colunas</h3>
              <table className="dataset-table" style={{ marginTop: '16px' }}>
                <thead>
                  <tr>
                    <th>Coluna</th>
                    <th>Tipo</th>
                    <th>Nulos</th>
                    <th>Únicos</th>
                    <th>Detalhes (Min/Max/Média ou Top 5)</th>
                  </tr>
                </thead>
                <tbody>
                  {profiling.colunas.map(col => (
                    <tr key={col.coluna}>
                      <td style={{ fontWeight: 500 }}>{col.coluna}</td>
                      <td>{col.tipo}</td>
                      <td>{col.nulls}</td>
                      <td>{col.unicos}</td>
                      <td className="text-muted" style={{ fontSize: '12px' }}>
                        {col.tipo === 'numérico' ? (
                          `Min: ${col.min} | Média: ${col.media} | Max: ${col.max}`
                        ) : (
                          col.top5?.map(t => `${t.valor} (${t.percentual})`).join(', ')
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Gráficos (Top 5 Categorias) */}
            <section>
              <h3>Distribuição Categórica</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '16px' }}>
                {profiling.colunas
                  .filter(col => col.tipo === 'texto' && col.top5)
                  .map(col => {
                    // Converte "6.5%" para número (6.5) para o Recharts
                    const chartData = col.top5.map(item => ({
                      nome: item.valor,
                      percentual: parseFloat(item.percentual)
                    }));

                    return (
                      <div key={col.coluna} style={{ background: 'var(--surface)', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <h4 style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>{col.coluna} (%)</h4>
                        <div style={{ height: '200px', marginTop: '16px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                              <XAxis type="number" hide />
                              <YAxis dataKey="nome" type="category" width={80} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                              <Tooltip 
                                cursor={{ fill: 'var(--surface-raised)' }}
                                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)' }}
                                itemStyle={{ color: 'var(--accent)' }}
                              />
                              <Bar dataKey="percentual" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* Preview de Dados */}
            <section>
              <h3>Preview (Top 20)</h3>
              <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                <table className="dataset-table" style={{ whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr>
                      {profiling.colunas.map(col => (
                        <th key={col.coluna}>{col.coluna}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {profiling.preview.map((row, i) => (
                      <tr key={i}>
                        {profiling.colunas.map(col => (
                          <td key={col.coluna}>{row[col.coluna]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        )}
      </div>
    </>
  );
}

function Card({ label, value }) {
  return (
    <div style={{ padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
      <div className="eyebrow" style={{ marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--accent)' }}>{value}</div>
    </div>
  );
}
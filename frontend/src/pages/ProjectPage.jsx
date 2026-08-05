// ============================================================
// ProjectPage.jsx
//
// Detalhe de um projeto: lista os datasets enviados, permite subir
// novos arquivos (CSV/JSON/Excel) e removê-los. O upload usa
// FormData (não JSON) porque estamos enviando um arquivo binário —
// é assim que o multer, no backend, espera receber.
// ============================================================

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Database, FileUp, Trash2, UploadCloud } from 'lucide-react';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectPage() {
  const { id } = useParams();
  const { show } = useToast();

  const [project, setProject] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [projectData, datasetsData] = await Promise.all([
        api.projects.get(id),
        api.datasets.list(id),
      ]);
      setProject(projectData);
      setDatasets(datasetsData);
    } catch (err) {
      show(err.message, 'danger');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(datasetId, name) {
    if (!confirm(`Remover o dataset "${name}"?`)) return;
    try {
      await api.datasets.remove(datasetId);
      setDatasets((current) => current.filter((d) => d.id !== datasetId));
      show('Dataset removido.', 'success');
    } catch (err) {
      show(err.message, 'danger');
    }
  }

  return (
    <>
      <Topbar
        title={project ? project.name : 'Carregando…'}
        breadcrumb={
          <Link to="/" className="topbar-back">
            <ArrowLeft size={13} /> Projetos
          </Link>
        }
      />

      <div className="app-content">
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <UploadCloud size={16} />
            Enviar dataset
          </button>
        </div>

        {!isLoading && datasets.length === 0 && (
          <EmptyState
            icon={Database}
            title="Nenhum dataset neste projeto"
            description="Envie um arquivo CSV, JSON ou Excel para começar a organizar seus dados."
            action={
              <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                <UploadCloud size={16} />
                Enviar o primeiro dataset
              </button>
            }
          />
        )}

        {datasets.length > 0 && (
          <table className="dataset-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Arquivo original</th>
                <th>Tamanho</th>
                <th>Enviado em</th>
                <th aria-label="Ações"></th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span className="dataset-name">
                      <FileUp size={14} strokeWidth={1.75} />
                      {d.name}
                    </span>
                  </td>
                  <td className="mono text-muted">{d.original_filename}</td>
                  <td className="mono">{formatBytes(Number(d.size_bytes))}</td>
                  <td className="mono text-muted">
                    {new Date(d.uploaded_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <button
                      className="btn-icon"
                      onClick={() => handleDelete(d.id, d.name)}
                      aria-label={`Remover ${d.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <UploadDatasetModal
          projectId={id}
          onClose={() => setIsModalOpen(false)}
          onUploaded={(dataset) => {
            setDatasets((current) => [...current, dataset]);
            setIsModalOpen(false);
            show('Dataset enviado.', 'success');
          }}
        />
      )}
    </>
  );
}

function UploadDatasetModal({ projectId, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { show } = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Selecione um arquivo.');
      return;
    }

    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('name', name || file.name);
    formData.append('file', file);

    setIsSubmitting(true);
    try {
      const dataset = await api.datasets.upload(formData);
      onUploaded(dataset);
    } catch (err) {
      setError(err.message);
      show(err.message, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Enviar dataset" onClose={onClose}>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="dataset-file">Arquivo (CSV, JSON ou Excel)</label>
          <input
            id="dataset-file"
            type="file"
            required
            accept=".csv,.json,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
        </div>
        <div className="field">
          <label htmlFor="dataset-name">Nome de exibição (opcional)</label>
          <input
            id="dataset-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={file ? file.name : 'Ex: Vendas de Janeiro'}
          />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

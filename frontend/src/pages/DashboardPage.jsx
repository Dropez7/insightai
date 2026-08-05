// ============================================================
// DashboardPage.jsx
//
// Tela inicial após o login: lista os projetos do usuário, permite
// criar novos e navegar para o detalhe de cada um (onde ficam os
// datasets). Segue o padrão: estado local para dados da API +
// useEffect para buscar ao montar + funções de mutação que
// atualizam esse estado local após confirmação do backend.
// ============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, Trash2, Database } from 'lucide-react';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const { show } = useToast();

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setIsLoading(true);
    try {
      const data = await api.projects.list(user.id);
      setProjects(data);
    } catch (err) {
      show(err.message, 'danger');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Remover o projeto "${name}"? Isso também apaga seus datasets.`)) return;
    try {
      await api.projects.remove(id);
      setProjects((current) => current.filter((p) => p.id !== id));
      show('Projeto removido.', 'success');
    } catch (err) {
      show(err.message, 'danger');
    }
  }

  return (
    <>
      <Topbar title="Projetos" breadcrumb={`Workspace de ${user.name.split(' ')[0]}`} />

      <div className="app-content">
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            Novo projeto
          </button>
        </div>

        {!isLoading && projects.length === 0 && (
          <EmptyState
            icon={FolderKanban}
            title="Nenhum projeto ainda"
            description="Crie um projeto para começar a organizar os seus datasets."
            action={
              <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                <Plus size={16} />
                Criar o primeiro projeto
              </button>
            }
          />
        )}

        <div className="project-grid">
          {projects.map((project) => (
            <Link to={`/projects/${project.id}`} key={project.id} className="project-card">
              <div className="project-card-icon">
                <Database size={18} strokeWidth={1.75} />
              </div>
              <h3>{project.name}</h3>
              <p>{project.description || 'Sem descrição.'}</p>
              <div className="project-card-footer">
                <span className="mono eyebrow">
                  criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
                </span>
                <button
                  className="btn-icon"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(project.id, project.name);
                  }}
                  aria-label={`Remover ${project.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <NewProjectModal
          userId={user.id}
          onClose={() => setIsModalOpen(false)}
          onCreated={(project) => {
            setProjects((current) => [...current, project]);
            setIsModalOpen(false);
            show('Projeto criado.', 'success');
          }}
        />
      )}
    </>
  );
}

function NewProjectModal({ userId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { show } = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const project = await api.projects.create({ userId, name, description });
      onCreated(project);
    } catch (err) {
      setError(err.message);
      show(err.message, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Novo projeto" onClose={onClose}>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="project-name">Nome</label>
          <input
            id="project-name"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Análise de Vendas 2026"
          />
        </div>
        <div className="field">
          <label htmlFor="project-description">Descrição (opcional)</label>
          <textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Do que se trata esse projeto?"
          />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Criando…' : 'Criar projeto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================
// client.js
//
// Um único ponto de contato com a API. Em vez de espalhar `fetch()`
// por todos os componentes (o que duplicaria tratamento de erro,
// montagem de URL, etc.), centralizamos isso aqui. Cada página só
// chama `api.projects.list()`, por exemplo, sem saber os detalhes
// de HTTP por trás.
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Função genérica de requisição. Trata JSON automaticamente e
// converte respostas de erro (4xx/5xx) em exceções JavaScript, para
// que os componentes possam usar try/catch normalmente.
async function request(path, { method = 'GET', body, isFormData = false } = {}) {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  // Respostas 204 (No Content, usada em DELETE) não têm corpo JSON.
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // O backend sempre devolve { error: "mensagem" } em falhas —
    // propagamos essa mensagem para a interface poder exibi-la.
    throw new Error(data?.error || 'Erro inesperado ao falar com o servidor.');
  }

  return data;
}

export const api = {
  users: {
    register: (payload) => request('/users', { method: 'POST', body: payload }),
    login: (payload) => request('/users/login', { method: 'POST', body: payload }),
  },
  projects: {
    list: (userId) => request(`/projects?userId=${userId}`),
    get: (id) => request(`/projects/${id}`),
    create: (payload) => request('/projects', { method: 'POST', body: payload }),
    update: (id, payload) => request(`/projects/${id}`, { method: 'PUT', body: payload }),
    remove: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  },
  datasets: {
    list: (projectId) => request(`/datasets?projectId=${projectId}`),
    get: (id) => request(`/datasets/${id}`), 
    upload: (formData) => request('/datasets', { method: 'POST', body: formData, isFormData: true }),
    rename: (id, name) => request(`/datasets/${id}`, { method: 'PUT', body: { name } }),
    remove: (id) => request(`/datasets/${id}`, { method: 'DELETE' }),
    generateAiInsights: (id) => request(`/datasets/${id}/ai-insights`, { method: 'POST' }),
  },
};

// ============================================================
// ProtectedLayout.jsx
//
// Faz duas coisas:
//   1. Guarda de rota: se não houver usuário logado, redireciona
//      para /login (e lembra pra onde a pessoa queria ir, via state).
//   2. Layout: monta a Sidebar + Topbar ao redor do conteúdo da
//      página (recebido via <Outlet /> do react-router).
// ============================================================

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function ProtectedLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null; // evita "piscar" a tela de login antes de checar o localStorage

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Cada página, dentro do <Outlet />, é responsável por renderizar seu
  // próprio <Topbar title="..." /> — assim títulos dinâmicos (como o
  // nome de um projeto carregado da API) funcionam sem gambiarra.
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Outlet />
      </div>
    </div>
  );
}

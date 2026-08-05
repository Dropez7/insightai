// ============================================================
// Topbar.jsx
//
// Barra superior de cada página autenticada: mostra em que contexto
// a pessoa está (título da página, com uma "trilha" opcional de
// volta) e quem está logado, com ação de sair.
// ============================================================

import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ title, breadcrumb }) {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div>
        {breadcrumb && <span className="topbar-breadcrumb">{breadcrumb}</span>}
        <h1 className="topbar-title">{title}</h1>
      </div>

      <div className="topbar-user">
        <div className="topbar-user-info">
          <span className="topbar-user-name">{user?.name}</span>
          <span className="topbar-user-email mono">{user?.email}</span>
        </div>
        <button className="btn-icon" onClick={logout} aria-label="Sair">
          <LogOut size={17} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}

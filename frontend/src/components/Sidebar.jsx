// ============================================================
// Sidebar.jsx
//
// Navegação lateral fixa, presente em todas as telas autenticadas.
// Nesta Versão 1 existe só um recurso navegável (Projetos), mas a
// estrutura já fica pronta para crescer (Relatórios, IA, Auditoria...
// conforme o roadmap avança).
// ============================================================

import { LayoutGrid } from 'lucide-react';
import SignalLine from './SignalLine';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-wordmark">InsightAI</span>
        <SignalLine className="sidebar-signal" />
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-nav-item active">
          <LayoutGrid size={17} strokeWidth={1.75} />
          Projetos
        </span>
      </nav>

      <div className="sidebar-footer">
        <span className="eyebrow">v1 · esqueleto</span>
      </div>
    </aside>
  );
}

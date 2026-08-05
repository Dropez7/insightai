// ============================================================
// AuthLayout.jsx
//
// Layout compartilhado entre Login e Registro: painel esquerdo com
// a identidade da marca (e o elemento de assinatura, a linha que se
// desenha), painel direito com o formulário em si. Extrair isso pra
// um componente evita duplicar essa estrutura nas duas telas.
// ============================================================

import SignalLine from './SignalLine';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <div className="auth-brand-content">
          <span className="auth-wordmark">InsightAI</span>
          <p className="auth-thesis">
            Entenda os seus dados
            <br />
            antes de perguntar.
          </p>
          <SignalLine className="auth-signal" />
          <span className="eyebrow">plataforma de análise inteligente</span>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-panel-content">{children}</div>
      </div>
    </div>
  );
}

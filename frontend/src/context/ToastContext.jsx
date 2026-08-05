// ============================================================
// ToastContext.jsx
//
// Sistema simples de notificações temporárias ("toasts"). Qualquer
// componente pode chamar useToast().show("mensagem") para exibir um
// aviso no canto da tela, que some sozinho depois de alguns segundos.
// Centralizar isso evita que cada tela reimplemente sua própria
// lógica de "mostrar e sumir depois de X segundos".
// ============================================================

import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, tone = 'default') => {
    const id = idCounter++;
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa ser usado dentro de um <ToastProvider>');
  return ctx;
}

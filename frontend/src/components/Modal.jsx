// ============================================================
// Modal.jsx
//
// Modal genérico usado para criar/editar projetos e fazer upload de
// datasets. Fecha ao clicar fora ou pressionar Esc — comportamento
// esperado de qualquer modal, então implementamos uma vez aqui em
// vez de repetir em cada tela que precisa de um.
// ============================================================

import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

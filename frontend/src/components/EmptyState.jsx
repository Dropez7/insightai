// ============================================================
// EmptyState.jsx
//
// Quando uma lista (projetos, datasets) está vazia, mostrar um
// espaço em branco silencioso não ajuda ninguém. Um bom estado vazio
// explica o que este lugar é e convida para a próxima ação.
// ============================================================

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={28} strokeWidth={1.5} />}
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

// ============================================================
// SignalLine.jsx
//
// O elemento de assinatura do InsightAI: uma linha fina, no estilo
// sparkline, que se desenha sozinha uma vez ao carregar a tela.
// A metáfora é a de um instrumento de medição registrando um sinal —
// afinal, é isso que a plataforma faz com os dados de quem a usa.
//
// Tecnicamente, o "desenho" é feito com o truque clássico de SVG:
// aplicamos um stroke-dasharray igual ao comprimento total do
// traçado e animamos o stroke-dashoffset de "comprimento total" até
// 0. Isso faz o traço parecer estar sendo desenhado em tempo real.
// ============================================================

export default function SignalLine({ className = '' }) {
  return (
    <svg
      className={`signal-line ${className}`}
      viewBox="0 0 320 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2 40 C 30 40, 40 14, 60 14 S 90 46, 112 46 S 140 20, 162 20
           S 190 50, 214 50 S 244 10, 268 10 S 300 34, 318 34"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

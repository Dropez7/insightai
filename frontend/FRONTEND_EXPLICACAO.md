# InsightAI — Frontend (Versão 1)

Este documento complementa o `EXPLICACAO_TECNICA.md` do backend,
explicando as decisões de arquitetura **e de design visual** do
frontend.

---

## 1. Stack e por quê

- **React + Vite**: Vite dá um servidor de desenvolvimento instantâneo
  (sem o tempo de build lento do Webpack/CRA) e é o padrão atual para
  projetos React que não precisam de SSR (Next.js só compensaria a
  partir da Versão 4+, quando pensarmos em SEO ou streaming de IA).
- **react-router-dom**: gerencia as URLs da aplicação (`/login`,
  `/projects/:id` etc.) inteiramente no navegador, sem recarregar a
  página — é o que torna isso uma SPA (Single Page Application).
- **lucide-react**: biblioteca de ícones SVG, leve e consistente.
- **CSS puro (sem framework)**: optamos por não usar Tailwind/Bootstrap
  aqui de propósito. Um sistema de design com identidade própria (ver
  seção 3) fica mais fácil de controlar com CSS direto + variáveis do
  que "encaixando" numa grade de utilitários genéricos.

---

## 2. Arquitetura de pastas

```
src/
├── api/client.js         → único ponto de contato com o backend
├── context/               → estado global (quem está logado, toasts)
├── components/             → peças reutilizáveis (Modal, Sidebar...)
├── pages/                  → uma tela completa por arquivo
├── styles/                  → tokens de design + CSS por área
├── App.jsx                  → mapa de rotas
└── main.jsx                 → ponto de entrada (monta o React na página)
```

Por que separar `components/` de `pages/`? Um **component** não sabe
"onde" está sendo usado — o `<Modal>` não sabe se está criando um
projeto ou fazendo upload de um dataset, ele só sabe "mostrar um
diálogo". Uma **page** é quem orquestra: busca dados da API, decide o
que mostrar, e usa os components como peças de montagem.

---

## 3. Sistema de design (o "porquê" visual)

Em vez de usar uma paleta e tipografia genéricas, definimos uma
identidade específica para o InsightAI, centralizada em
`styles/tokens.css` — isso significa que qualquer cor, fonte ou
espaçamento usado na interface vem de uma variável CSS, nunca de um
valor solto (`#ffffff` direto em um componente, por exemplo). Trocar a
identidade visual inteira no futuro vira questão de editar um único
arquivo.

**Paleta**: fundo escuro com um leve tom verde-azulado (não é preto
puro — remete a um quadro-negro de laboratório), com dourado-latão
como cor de destaque (ações principais, links, o elemento de
assinatura) e verde-sálvia como contraponto secundário.

**Tipografia**: três famílias, cada uma com um papel:
- `Fraunces` (serifada, com personalidade) — só para títulos grandes.
- `IBM Plex Sans` — toda a interface funcional (botões, labels, texto).
- `IBM Plex Mono` — qualquer coisa que seja um **dado**: tamanhos de
  arquivo, datas, emails, IDs. Isso cria uma associação visual: "texto
  em monoespaçada = informação factual sobre um registro".

**Elemento de assinatura** (`components/SignalLine.jsx`): uma linha
fina em SVG, no estilo *sparkline*, que se desenha sozinha ao carregar
a tela de login — a metáfora de um instrumento de medição registrando
um sinal, o que é literalmente o que a plataforma faz com os dados de
quem a usa. Tecnicamente, isso é feito com o truque clássico de
animação de SVG: o traço recebe um `stroke-dasharray` igual (ou maior)
ao seu comprimento total, e o `stroke-dashoffset` anima de "comprimento
total" até `0`, dando a ilusão de estar sendo desenhado em tempo real
(ver `.auth-signal path` em `styles/auth.css`).

---

## 4. Como os dados fluem (exemplo: criar um projeto)

```
DashboardPage
   │  usuário clica em "Novo projeto"
   ▼
abre <NewProjectModal> (definido dentro do próprio DashboardPage.jsx,
   já que só é usado ali)
   │  usuário preenche o formulário e envia
   ▼
api.projects.create({ userId, name, description })
   │  (em api/client.js: monta o fetch, define método POST,
   │   serializa o corpo como JSON)
   ▼
Backend responde com o projeto criado (201)
   │
   ▼
onCreated(project) → atualiza o estado local `projects` no
DashboardPage, SEM precisar recarregar a lista inteira da API de novo
```

Esse padrão — atualizar o estado local com a resposta da própria
mutação, em vez de sempre re-buscar a lista inteira — deixa a interface
mais responsiva. É seguro fazer isso porque o backend devolve o
registro completo (`RETURNING *` no SQL) em cada criação.

---

## 5. Autenticação (o que existe agora e o que falta)

O backend da Versão 1 **não emite tokens JWT ainda** (isso é Versão 5
do roadmap). Por isso, o frontend implementa uma "sessão" simplificada
em `context/AuthContext.jsx`: após o login, guardamos os dados públicos
do usuário (id, nome, email) no `localStorage`, só para a sessão
sobreviver a um F5 da página.

**Isso não é seguro para produção** — qualquer pessoa pode editar o
`localStorage` do navegador e "se passar" por outro `userId`. O
comentário no código deixa isso explícito de propósito, para não
esquecermos quando chegar a hora de trocar por JWT de verdade (o token
viria em cada requisição via header `Authorization: Bearer <token>`, e
o backend validaria a assinatura em vez de confiar cegamente no que o
cliente manda).

---

## 6. Como rodar

```bash
cd frontend
npm install
cp .env.example .env      # ajuste VITE_API_URL se o backend não estiver em localhost:3000
npm run dev
```

A aplicação sobe em `http://localhost:5173`. Certifique-se de que o
backend (Docker Compose) já está rodando em `http://localhost:3000`
antes de tentar fazer login/cadastro.

---

## 7. Próximos passos sugeridos para o frontend

1. **Estados de carregamento mais ricos** (skeletons em vez de tela em
   branco enquanto os dados chegam).
2. **Paginação/filtros** na lista de datasets, conforme a Versão 2
   trouxer mais volume de dados por projeto.
3. Quando o backend ganhar JWT (Versão 5): trocar o `AuthContext` para
   guardar o token, anexá-lo em `api/client.js` (`Authorization`
   header), e tratar expiração/refresh.
4. Uma tela de detalhe do dataset (Versão 2/3), mostrando as análises
   automáticas que o backend vai gerar.

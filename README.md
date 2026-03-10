# 852 Inteligência

> Canal de inteligência institucional para os **852 municípios** de Minas Gerais.

Plataforma anônima e segura baseada no ecossistema EGOS para coleta, estruturação e análise de relatos de Policiais Civis, em parceria com o Sindpol-MG.

## System Map

```text
852-inteligencia/
├── .egos/                     # Local symlink → /home/enio/.egos (shared governance SSOT)
├── .guarani/                  # Local governance overrides
│   ├── IDENTITY.md            # Agent 852 identity & mission
│   └── PREFERENCES.md         # Repo-specific rules and exceptions
├── .windsurf/                 # Local symlinked workflows/skills via egos-gov
├── docker-compose.yml         # VPS runtime contract (source of truth)
├── LICENSE                    # MIT license for public reuse
├── .husky/
│   └── pre-commit             # Pre-commit hook (tsc + lint + .env guard + egos-gov)
├── public/
│   └── brand/                 # Logo, avatar, OG image, background pattern
├── docs/
│   └── AUTORESEARCH_TRIGGERS.md  # Trigger system architecture (Karpathy-inspired)
├── sql/
│   ├── schema.sql             # Supabase schema (chats, messages, insights + RLS)
│   └── ethik.sql              # ETHIK gamification schema (contributors, txs, contests)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       ├── route.ts       # POST /api/chat — AI streaming (Qwen/Gemini/GPT)
│   │   │       └── info/
│   │   │           └── route.ts   # GET /api/chat/info — Model metadata & cost
│   │   ├── chat/
│   │   │   └── page.tsx           # Chat UI (history, markdown, export, mobile drawer)
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Insights dashboard (Recharts)
│   │   ├── ethik/
│   │   │   └── page.tsx           # ETHIK leaderboard + gamification rules
│   │   ├── layout.tsx             # Root layout (metadata, icons, OG, pt-BR)
│   │   ├── page.tsx               # Landing page + navigation
│   │   └── globals.css            # Tailwind base styles
│   ├── components/chat/
│   │   ├── FAQModal.tsx           # FAQ modal
│   │   ├── MarkdownMessage.tsx    # GFM markdown renderer
│   │   └── Sidebar.tsx            # History sidebar
│   └── lib/
│       ├── chat-store.ts          # localStorage conversation persistence
│       ├── prompt.ts              # System prompt (Agente 852)
│       ├── rate-limit.ts          # In-memory rate limiting for public chat
│       └── ethik.ts               # ETHIK engine (points, rules, mock data)
├── AGENTS.md                  # Repo map + deploy surface + governance entrypoint
├── TASKS.md                   # SSOT for tasks (P0/P1/P2)
├── .windsurfrules             # EGOS workspace governance
└── package.json               # 852-inteligencia
```

## Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **Runtime** | Node 20 / npm |
| **AI** | Vercel AI SDK v6 (`@ai-sdk/openai` + `@ai-sdk/react`) |
| **LLM Primary** | Alibaba Qwen-plus via DashScope |
| **LLM Fallback** | Google Gemini 2.0 Flash via OpenRouter (paid) / GPT-4o Mini |
| **Database** | Supabase PostgreSQL (RLS enforced) |
| **UI** | TailwindCSS 4 + Lucide Icons + Recharts |
| **Export** | jsPDF + docx + file-saver |
| **Deploy** | Contabo VPS + Docker Compose + Caddy |

## Features

- **Chatbot Anônimo** — Canal seguro com streaming token-by-token estilo ChatGPT
- **Agente 852** — IA treinada para ocultar dados sensíveis (nomes, CPF, processos) e conduzir relatos estruturados
- **Histórico Local** — Conversas persistidas no navegador com sidebar colapsável
- **Markdown Renderizado** — Respostas com listas, negrito, código e tabelas
- **Model Transparency** — Painel mostrando qual LLM está em uso e custo estimado
- **Exportação** — PDF, DOCX, Markdown + compartilhamento WhatsApp
- **Dashboard de Insights** — Visualização de padrões por categoria, cargo e região
- **Mobile First & Dark Mode** — Design Palantir/Linear para inteligência policial
- **Privacy by Design** — RLS no Supabase, sem coleta de PII, anonimato total
- **API Hardening** — Rate limit, validação de payload e fallback explícito de provider

## Quick Start

```bash
git clone <repo> && cd 852
npm install
cp .env.example .env   # Configure suas API keys
npm run dev            # http://localhost:3000
```

## Environment Variables

```env
DASHSCOPE_API_KEY=sk-xxx          # Alibaba DashScope (primary)
OPENROUTER_API_KEY=sk-or-xxx      # OpenRouter paid Gemini 2.0 fallback
OPENAI_API_KEY=sk-xxx             # Optional tertiary fallback
```

## License

MIT

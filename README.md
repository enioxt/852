# 852 Inteligência

> Canal de inteligência institucional para os **852 municípios** de Minas Gerais.

Plataforma anônima e segura baseada no ecossistema EGOS para coleta, estruturação e análise de relatos de Policiais Civis, em parceria com o Sindpol-MG.

## System Map

```text
852-inteligencia/
├── .guarani/                  # EGOS governance layer
│   ├── IDENTITY.md            # Agent 852 identity & mission
│   └── PREFERENCES.md         # Coding standards & rules
├── LICENSE                    # MIT license for public reuse
├── .husky/
│   └── pre-commit             # Pre-commit hook (tsc + lint + .env guard)
├── netlify.toml               # Web deploy configuration
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
│   │   │   └── page.tsx           # Chat UI (streaming, export, model info)
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Insights dashboard (Recharts)
│   │   ├── ethik/
│   │   │   └── page.tsx           # ETHIK leaderboard + gamification rules
│   │   ├── layout.tsx             # Root layout (pt-BR, dark mode)
│   │   ├── page.tsx               # Landing page + navigation
│   │   └── globals.css            # Tailwind base styles
│   └── lib/
│       ├── prompt.ts              # System prompt (Agente 852)
│       └── ethik.ts               # ETHIK engine (points, rules, mock data)
├── TASKS.md                   # SSOT for tasks (P0/P1/P2)
├── .windsurfrules             # EGOS workspace governance
└── package.json               # 852-inteligencia
```

## Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **Runtime** | Bun |
| **AI** | Vercel AI SDK v6 (`@ai-sdk/openai` + `@ai-sdk/react`) |
| **LLM Primary** | Alibaba Qwen-plus via DashScope |
| **LLM Fallback** | Google Gemini 2.0 Flash via OpenRouter (paid) / GPT-4o Mini |
| **Database** | Supabase PostgreSQL (RLS enforced) |
| **UI** | TailwindCSS 4 + Lucide Icons + Recharts |
| **Export** | jsPDF + docx + file-saver |
| **Deploy** | Netlify or Vercel |

## Features

- **Chatbot Anônimo** — Canal seguro com streaming token-by-token estilo ChatGPT
- **Agente 852** — IA treinada para ocultar dados sensíveis (nomes, CPF, processos) e conduzir relatos estruturados
- **Model Transparency** — Painel mostrando qual LLM está em uso e custo estimado
- **Exportação** — PDF, DOCX, Markdown + compartilhamento WhatsApp
- **Dashboard de Insights** — Visualização de padrões por categoria, cargo e região
- **Mobile First & Dark Mode** — Design Palantir/Linear para inteligência policial
- **Privacy by Design** — RLS no Supabase, sem coleta de PII, anonimato total

## Quick Start

```bash
git clone <repo> && cd 852
bun install
cp .env.example .env   # Configure suas API keys
bun run dev             # http://localhost:3000
```

## Environment Variables

```env
DASHSCOPE_API_KEY=sk-xxx          # Alibaba DashScope (primary)
OPENROUTER_API_KEY=sk-or-xxx      # OpenRouter paid Gemini 2.0 fallback
OPENAI_API_KEY=sk-xxx             # Optional tertiary fallback
```

## License

MIT

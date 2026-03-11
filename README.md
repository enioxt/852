# 852 Inteligência

> Canal de inteligência institucional para os **852 municípios** de Minas Gerais.

Plataforma anônima e segura baseada no ecossistema EGOS para coleta, estruturação e análise de relatos de Policiais Civis.

## Features

- **Chatbot Anônimo** — Streaming token-by-token com IA (Qwen-plus / Gemini 2.0 fallback)
- **ATRiAN Truth Layer** — Validação ética de output: sem fabricação de dados, siglas inventadas ou promessas falsas
- **PII Scanner** — Detecção automática de CPF, RG, MASP, telefones, emails, REDS, placas e nomes
- **Revisão por IA** — Análise de completude da conversa, pontos cegos e sugestões de aprofundamento
- **Report Sharing** — Compartilhamento de relatos sanitizados (link + WhatsApp) com controle total do usuário
- **Histórico Local** — Conversas persistidas no navegador com sidebar colapsável
- **Exportação** — PDF, DOCX, Markdown
- **Markdown Renderizado** — GFM completo nas respostas da IA
- **Telemetria** — Microsoft Clarity + structured JSON logs + admin dashboard
- **Notificações Operacionais** — Webhook/Telegram fire-and-forget para novas pautas e votos
- **Mobile First & Dark Mode** — Design Palantir/Linear para inteligência policial
- **API Hardening** — Rate limit, validação de payload, fallback explícito de provider

## User Flow

```text
Landing (/)
  ├── "Iniciar conversa" → /chat
  │     ├── Quick Actions → starts conversation
  │     ├── Free text → AI streaming response
  │     ├── Export (PDF/DOCX/MD)
  │     ├── "Enviar Relatório" → 3-step review
  │     │     ├── Step 1: PII scan + user accepts removals
  │     │     ├── Step 2: AI review (completude, sugestões)
  │     │     │     └── Click suggestion → analysis injected into chat
  │     │     └── Step 3: Share (link, WhatsApp, delete)
  │     ├── Sidebar (history, Home, Reports, FAQ)
  │     └── Home icon → back to /
  │
  ├── "Ver relatórios" → /reports
  │     ├── Relatos Compartilhados (view/delete)
  │     └── Gerador de Relatórios (AI HTML reports)
  │
  └── /dashboard, /admin/telemetry, /admin/validations
```

## Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **Runtime** | Node 20 / npm |
| **AI** | Vercel AI SDK v6 (`@ai-sdk/openai` + `@ai-sdk/react`) |
| **LLM Primary** | Alibaba Qwen-plus via DashScope |
| **LLM Fallback** | Google Gemini 2.0 Flash via OpenRouter (paid) |
| **Ethics** | ATRiAN validation (prompt + output filter) |
| **Privacy** | PII Scanner (regex + heuristics) |
| **UI** | TailwindCSS 4 + Lucide Icons + Recharts |
| **Export** | jsPDF + docx + file-saver |
| **Analytics** | Microsoft Clarity |
| **Deploy** | Contabo VPS + Docker Compose + Caddy |

## System Map

```text
src/
├── app/
│   ├── api/chat/route.ts         # POST /api/chat — AI streaming + ATRiAN
│   ├── api/chat/info/route.ts    # GET  /api/chat/info — model metadata
│   ├── api/review/route.ts       # POST /api/review — AI conversation review
│   ├── api/report/route.ts       # POST /api/report — AI HTML report gen
│   ├── api/telemetry/route.ts    # GET  /api/telemetry — stats
│   ├── api/issues/route.ts       # GET/POST /api/issues — pautas, votos e comentários
│   ├── chat/page.tsx             # Chat UI + report review modal
│   ├── reports/page.tsx          # Shared reports + AI report generator
│   ├── dashboard/page.tsx        # Insights dashboard
│   ├── admin/telemetry/page.tsx  # Admin telemetry
│   ├── admin/validations/page.tsx # Admin validations
│   ├── layout.tsx                # Root layout (Clarity, fonts, metadata)
│   └── page.tsx                  # Landing page
├── components/chat/
│   ├── Sidebar.tsx               # History + nav (Home, Reports, FAQ)
│   ├── ReportReview.tsx          # 3-step PII → AI → Share modal
│   ├── FAQModal.tsx              # FAQ
│   └── MarkdownMessage.tsx       # GFM renderer
└── lib/
    ├── ai-provider.ts            # Shared provider config (DRY)
    ├── atrian.ts                 # ATRiAN ethical output validation
    ├── chat-store.ts             # localStorage conversations
    ├── pii-scanner.ts            # PII detection (CPF, RG, MASP, etc.)
    ├── prompt.ts                 # System prompt + truth layer
    ├── rate-limit.ts             # In-memory rate limiting
    ├── notifications.ts          # Webhook/Telegram alerts
    ├── report-store.ts           # localStorage reports (Supabase-ready)
    ├── telemetry.ts              # Dual telemetry (Supabase + JSON logs)
```

## Quick Start

```bash
git clone https://github.com/enioxt/852.git && cd 852
npm install
cp .env.example .env   # Configure API keys
npm run dev            # http://localhost:3000
```

## Environment Variables

```env
DASHSCOPE_API_KEY=sk-xxx              # Alibaba DashScope (primary LLM)
OPENROUTER_API_KEY=sk-or-xxx          # OpenRouter Gemini 2.0 (fallback)
NEXT_PUBLIC_CLARITY_ID=xxx            # Microsoft Clarity project ID
# Optional:
SUPABASE_URL=https://xxx.supabase.co          # Server-side persistence
SUPABASE_SERVICE_ROLE_KEY=xxx                 # Supabase service key
ADMIN_SETUP_KEY=xxx                           # Bootstrap do primeiro admin
PUBLIC_BASE_URL=https://852.egos.ia.br       # Base pública usada em links/alertas
ISSUE_ALERT_WEBHOOK_URL=https://hook.example # Webhook para novas pautas/votos
ISSUE_ALERT_WEBHOOK_SECRET=xxx               # Segredo opcional do webhook
TELEGRAM_BOT_TOKEN=xxx                       # Bot Telegram opcional
TELEGRAM_CHAT_ID=xxx                         # Chat destino opcional
```

## Deploy

```bash
# Build
npm run build

# VPS deploy (Contabo)
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.env' \
  --exclude='.git' --exclude='.egos' ./ contabo:/opt/852/
ssh contabo "cd /opt/852 && docker compose build --no-cache && docker compose up -d"

# Smoke test
curl -I https://852.egos.ia.br
```

## Roadmap

| Priority | Feature |
|----------|---------|
| **P1** | Supabase persistence (conversations + reports server-side) |
| **P1** | Dashboard with real aggregated metrics |
| **P1** | Admin auth for telemetry/reports |
| **P2** | Session hashing (unique hash per interaction) |
| **P2** | Agent memory across sessions |
| **P2** | Insight enrichment with real operational data |
| **P2** | ATRiAN v2: NeMo Guardrails integration |
| **P3** | Tool use: web search for institutional data |
| **P3** | Voice input (speech-to-text) |

## License

MIT

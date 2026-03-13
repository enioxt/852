# 852 Inteligencia

> Canal de inteligencia institucional para os **852 municipios** de Minas Gerais.

Plataforma anonima e segura baseada no ecossistema EGOS para coleta, estruturacao e analise de relatos de Policiais Civis.

## Features

- **Chatbot Anonimo** -- Streaming token-by-token com IA (Qwen-plus / Gemini 2.0 fallback)
- **ATRiAN Truth Layer** -- Validacao etica de output: sem fabricacao de dados, siglas inventadas ou promessas falsas
- **PII Scanner** -- Deteccao automatica de CPF, RG, MASP, telefones, emails, REDS, placas e nomes
- **Revisao por IA** -- Analise de completude da conversa, pontos cegos e sugestoes de aprofundamento
- **Report Sharing** -- Compartilhamento de relatos sanitizados (link + WhatsApp) com controle total do usuario
- **Smart Correlation** -- Motor de correlacao inteligente: AI tags + busca em issues/reports existentes
- **Papo de Corredor** -- Feed de topicos quentes com ranking por engajamento (votos + comentarios + recencia)
- **Sugestao Direta** -- Texto livre com upload de arquivos, autosave visual, PII/ATRiAN e publicacao no forum
- **Biblioteca Juridica** -- 27+ leis, sumulas e normativas + glossario operacional policial
- **Gamificacao** -- Pontos, ranks policiais (Recruta a Comissario), leaderboard anonimo
- **Identidade Anonima** -- Codinomes policiais auto-gerados + validacao AI de nomes reais
- **Historico Local** -- Conversas persistidas no navegador com sidebar colapsavel
- **Exportacao** -- PDF, DOCX, Markdown
- **Telemetria** -- Microsoft Clarity + Supabase + structured JSON logs + admin dashboard
- **Notificacoes Operacionais** -- Webhook/Telegram fire-and-forget para novas pautas e votos
- **Mobile First & Dark Mode** -- Design Palantir/Linear para inteligencia policial
- **API Hardening** -- Rate limit, validacao de payload, fallback explicito de provider

## User Flow

```text
Landing (/)
  |-- "Iniciar conversa" -> /chat
  |     |-- Quick Actions -> starts conversation
  |     |-- Free text -> AI streaming response
  |     |-- Export (PDF/DOCX/MD)
  |     |-- "Enviar Relatorio" -> 3-step review
  |     |     |-- Step 1: PII scan + user accepts removals
  |     |     |-- Step 2: AI review (completude, sugestoes)
  |     |     '-- Step 3: Share (link, WhatsApp, delete)
  |     '-- Sidebar (history, Home, Reports, Corredor, FAQ)
  |
  |-- "Escrever direto" -> /sugestao
  |     |-- Texto livre + categoria + tags
  |     |-- Upload de PDF/DOC/DOCX/TXT/MD
  |     |-- PII scanner + ATRiAN preview
  |     |-- Smart Correlation (AI tags + related issues/reports)
  |     |-- Autosave local com indicador visual
  |     '-- Publicacao final em /issues
  |
  |-- "Papo de Corredor" -> /papo-de-corredor
  |     |-- Top 3 featured topics (medal ranking)
  |     |-- Full ranked list by engagement score
  |     '-- 2-minute auto-refresh
  |
  |-- "Biblioteca Juridica" -> /legislacao
  |     |-- Leis e normativas por categoria
  |     '-- Glossario operacional
  |
  |-- "Ver relatorios" -> /reports
  |     |-- Relatos Compartilhados (view/delete)
  |     '-- Relatorios de Inteligencia (AI auto-gerados)
  |
  '-- Internal: /issues, /dashboard, /admin/telemetry
```

## Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **Runtime** | Node 20 / npm |
| **AI** | Vercel AI SDK v6 (`@ai-sdk/openai` + `@ai-sdk/react`) |
| **LLM Primary** | Alibaba Qwen-plus via DashScope |
| **LLM Fallback** | Google Gemini 2.0 Flash via OpenRouter (paid) |
| **Database** | Supabase PostgreSQL |
| **Ethics** | ATRiAN validation (prompt + output filter) |
| **Privacy** | PII Scanner (regex + heuristics) |
| **UI** | TailwindCSS 4 + Lucide Icons + Recharts |
| **Export** | jsPDF + docx + file-saver |
| **Analytics** | Microsoft Clarity |
| **Deploy** | Contabo VPS + Docker Compose + Caddy |

## System Map

```text
src/
|-- app/
|   |-- api/chat/route.ts         # POST /api/chat -- AI streaming + ATRiAN
|   |-- api/correlate/route.ts    # POST /api/correlate -- AI tag extraction + search
|   |-- api/hot-topics/route.ts   # GET  /api/hot-topics -- trending topics
|   |-- api/review/route.ts       # POST /api/review -- AI conversation review
|   |-- api/report/route.ts       # POST /api/report -- AI HTML report gen
|   |-- api/issues/route.ts       # GET/POST /api/issues -- forum topics
|   |-- api/telemetry/route.ts    # GET  /api/telemetry -- stats
|   |-- chat/page.tsx             # Chat UI
|   |-- sugestao/page.tsx         # Free-text suggestion + correlation
|   |-- papo-de-corredor/page.tsx # Trending community topics
|   |-- legislacao/page.tsx       # Legal library + glossary
|   |-- issues/page.tsx           # Discussion board
|   |-- reports/page.tsx          # Shared reports + AI reports
|   |-- dashboard/page.tsx        # Insights dashboard
|   '-- page.tsx                  # Landing page
|-- components/
|   |-- chat/Sidebar.tsx          # History + nav
|   |-- chat/ReportReview.tsx     # 3-step PII -> AI -> Share
|   |-- CorrelationPanel.tsx      # AI tags + related content
|   |-- HotTopicsTicker.tsx       # Sidebar trending widget
|   '-- MobileNav.tsx             # Mobile bottom nav (6 tabs)
'-- lib/
    |-- ai-provider.ts            # Shared provider config (7 task types)
    |-- atrian.ts                 # ATRiAN ethical output validation
    |-- correlate.ts              # Supabase issue/report search
    |-- pii-scanner.ts            # PII detection (CPF, RG, MASP, etc.)
    |-- gamification.ts           # Points, ranks, leaderboard
    |-- notifications.ts          # Webhook/Telegram alerts
    '-- telemetry.ts              # Dual telemetry (Supabase + JSON logs)
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
PUBLIC_BASE_URL=https://852.egos.ia.br       # Base publica usada em links/alertas
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
| **P1** | Espiral de Escuta (reports <85% approval reopen discussion) |
| **P1** | Correlation in /chat (trigger after AI response) |
| **P1** | AI summaries in Papo de Corredor (weekly digest) |
| **P1** | LGPD consent banner + self-service data access |
| **P2** | ATRiAN v2: NeMo Guardrails integration |
| **P2** | Voice input (speech-to-text) |
| **P2** | Cross-conversation insight aggregation |
| **P3** | Tool use: web search for institutional data |
| **P3** | BYOK: users plug own API keys |

## License

MIT

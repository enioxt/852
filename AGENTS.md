# AGENTS.md — 852 Inteligência

> **VERSION:** 2.0.0 | **UPDATED:** 2026-03-10
> **TYPE:** Next.js production chatbot + report sharing + EGOS-governed public repo

---

<!-- llmrefs:start -->

## LLM Reference Signature

- **Role:** workspace map + deploy surface + governance entrypoint
- **Summary:** Public anonymous institutional intelligence chatbot for Civil Police officers in Minas Gerais. Features AI-powered chat, PII detection, conversation review, report sharing with full user control, and ATRiAN ethical validation. Deployed on Contabo VPS, governed by the EGOS mesh.
- **Read next:**
  - `.windsurfrules` — active repo governance and local mandates
  - `TASKS.md` — current priorities and blockers
  - `.egos/guarani/PREFERENCES_SHARED.md` — shared EGOS standards
  - `.guarani/PREFERENCES.md` — repo-specific overrides

<!-- llmrefs:end -->

## Project Overview

| Item | Value |
|------|-------|
| **Project** | 852 Inteligência |
| **Path** | `/home/enio/852` |
| **Public URL** | `https://852.egos.ia.br` |
| **Public Repo** | `github.com/enioxt/852` |
| **Framework** | Next.js 16 + App Router |
| **Runtime** | Node 20 / npm |
| **Primary LLM** | Alibaba Qwen-plus via DashScope |
| **Fallback LLM** | Gemini 2.0 Flash via OpenRouter (paid) |
| **Persistence** | localStorage (client) — Supabase-ready architecture |
| **Analytics** | Microsoft Clarity (vtsny72z0w) |
| **Governance SSOT** | `/home/enio/.egos` via `.egos` symlink |

## Architecture

```text
852/
├── .egos/                            # Shared EGOS governance symlink (local only)
├── .guarani/
│   ├── IDENTITY.md                   # Agent 852 identity
│   └── PREFERENCES.md               # Local repo overrides
├── .windsurf/workflows/              # Synced Windsurf workflows (local symlinks)
├── docker-compose.yml                # VPS runtime contract (SSOT)
├── public/brand/                     # Logo, avatar, OG image, background pattern
│
├── src/app/
│   ├── api/chat/route.ts             # POST /api/chat — AI streaming + ATRiAN validation
│   ├── api/chat/info/route.ts        # GET  /api/chat/info — model/provider metadata
│   ├── api/review/route.ts           # POST /api/review — AI conversation analysis
│   ├── api/report/route.ts           # POST /api/report — AI HTML report generation
│   ├── api/telemetry/route.ts        # GET  /api/telemetry — stats from Supabase
│   ├── chat/page.tsx                 # Main chat UI (history, export, review modal)
│   ├── reports/page.tsx              # Shared reports + AI report generator (tabs)
│   ├── dashboard/page.tsx            # Insights dashboard (Recharts)
│   ├── ethik/page.tsx                # ETHIK leaderboard + gamification
│   ├── admin/telemetry/page.tsx      # Admin telemetry dashboard
│   ├── layout.tsx                    # Root layout (metadata, Clarity, fonts)
│   └── page.tsx                      # Landing page
│
├── src/components/chat/
│   ├── Sidebar.tsx                   # History sidebar + nav (Home, Reports, FAQ)
│   ├── FAQModal.tsx                  # FAQ modal
│   ├── MarkdownMessage.tsx           # GFM markdown rendering
│   └── ReportReview.tsx              # 3-step report review modal (PII → AI → Share)
│
├── src/lib/
│   ├── ai-provider.ts               # Shared AI provider config (DRY)
│   ├── atrian.ts                     # ATRiAN ethical validation (output filter)
│   ├── chat-store.ts                 # localStorage conversation persistence
│   ├── pii-scanner.ts               # PII detection (CPF, RG, MASP, phone, email, REDS, plates, names)
│   ├── prompt.ts                     # Agent 852 system prompt + truth layer
│   ├── rate-limit.ts                 # In-memory rate limiting
│   ├── report-store.ts              # localStorage report persistence (Supabase-ready)
│   ├── telemetry.ts                  # Dual telemetry: Supabase + structured JSON logs
│   └── ethik.ts                      # ETHIK gamification engine
│
├── src/components/
│   ├── ClarityAnalytics.tsx          # Microsoft Clarity tracking component
│   └── ui/                           # Shared UI components
│
├── sql/
│   ├── schema.sql                    # Supabase schema (chats, messages, insights + RLS)
│   └── ethik.sql                     # ETHIK gamification schema
│
├── AGENTS.md                         # THIS FILE — system map + capabilities + roadmap
├── TASKS.md                          # SSOT for tasks (P0/P1/P2)
├── README.md                         # Public-facing documentation
└── .windsurfrules                    # Active Windsurf repo rules
```

## Agent 852 — Current Capabilities

| # | Capability | Module | Status |
|---|-----------|--------|--------|
| 1 | AI Chat Streaming | `api/chat/route.ts` | Active |
| 2 | Multi-provider fallback (Qwen → Gemini → GPT) | `ai-provider.ts` | Active |
| 3 | ATRiAN Truth Layer (prompt rules) | `prompt.ts` | Active |
| 4 | ATRiAN Output Validation | `atrian.ts` | Active |
| 5 | PII Auto-Detection | `pii-scanner.ts` | Active |
| 6 | AI Conversation Review | `api/review/route.ts` | Active |
| 7 | Report Sharing (localStorage) | `report-store.ts` | Active |
| 8 | Conversation Persistence (localStorage) | `chat-store.ts` | Active |
| 9 | Export (PDF/DOCX/Markdown) | `chat/page.tsx` | Active |
| 10 | WhatsApp Sharing | `chat/page.tsx` | Active |
| 11 | Telemetry (Clarity + JSON logs) | `telemetry.ts` | Active |
| 12 | Rate Limiting | `rate-limit.ts` | Active |
| 13 | Markdown Rendering (GFM) | `MarkdownMessage.tsx` | Active |

## Agent 852 — Planned Capabilities (Roadmap)

| # | Capability | Priority | Dependency |
|---|-----------|----------|------------|
| 1 | Supabase persistence (conversations + reports server-side) | P1 | Supabase env vars |
| 2 | Cross-conversation insight aggregation | P1 | Supabase |
| 3 | Session hashing (each interaction tracked with unique hash) | P2 | Supabase |
| 4 | Agent memory across sessions (user context) | P2 | Supabase |
| 5 | ATRiAN v2: NeMo Guardrails or stream-level filtering | P2 | Python sidecar |
| 6 | ATRiAN violations dashboard | P2 | Admin auth |
| 7 | Real-time collaboration suggestions (proactive) | P2 | Prompt engineering |
| 8 | Tool use: web search for institutional data | P3 | AI SDK tools |
| 9 | Voice input (speech-to-text) | P3 | Browser API |
| 10 | ETHIK gamification with real data | P2 | Supabase |
| 11 | Dashboard with real metrics | P1 | Supabase |
| 12 | Admin auth for telemetry/reports | P1 | NextAuth or Supabase Auth |
| 13 | Automated PDF report generation from aggregated data | P2 | Multiple reports |

## User Flow

```text
Landing (/)
  ├── "Iniciar conversa" → /chat
  │     ├── Quick Actions → starts conversation
  │     ├── Free text → AI streaming response
  │     ├── Export (PDF/DOCX/MD) → local download
  │     ├── "Enviar Relatório" → ReportReview modal
  │     │     ├── Step 1: PII Scanner → highlights sensitive data
  │     │     ├── Step 2: AI Review → completude score, suggestions
  │     │     │     └── Click suggestion → injects analysis into chat + continues
  │     │     └── Step 3: Share → save report, WhatsApp, copy link, delete
  │     ├── Sidebar → conversation history, Home, Reports, FAQ
  │     └── Home icon → back to /
  │
  ├── "Ver relatórios" → /reports
  │     ├── Tab: Relatos Compartilhados → view/delete shared reports
  │     └── Tab: Gerador de Relatórios → AI HTML report from prompt
  │
  └── Internal pages
        ├── /dashboard → insights (mock data currently)
        ├── /ethik → gamification leaderboard
        └── /admin/telemetry → KPIs, model usage, events
```

## Deploy Surface

| Layer | Value |
|------|-------|
| **VPS** | Contabo |
| **IP** | `217.216.95.126` |
| **Reverse Proxy** | Caddy |
| **App Path (VPS)** | `/opt/852` |
| **Container Port** | `3000` |
| **Host Port** | `3001` |
| **Caddy Path** | `/opt/bracc/infra/Caddyfile` |
| **Compose File** | `/opt/852/docker-compose.yml` |

## Frozen / Sensitive Zones

- `.env*` files — never commit, never rsync to VPS
- `.egos/` shared governance source — read-only symlink
- `.husky/` — governance hooks only
- VPS infra files outside `/opt/852` scope

## Commands

```bash
# Local
npm run dev
npm run build
npm run lint

# VPS deploy
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.env' --exclude='.git' \
  --exclude='.egos' --exclude='.agent' --exclude='.windsurf' \
  --exclude='.guarani/orchestration' --exclude='.guarani/philosophy' \
  --exclude='.guarani/prompts' --exclude='.guarani/refinery' ./ contabo:/opt/852/
ssh contabo "cd /opt/852 && docker compose build --no-cache && docker compose up -d --force-recreate"

# Smoke tests
curl -I https://852.egos.ia.br
curl -s -o /dev/null -w "%{http_code}" https://852.egos.ia.br/chat
curl -s -o /dev/null -w "%{http_code}" https://852.egos.ia.br/reports
```

## Governance Notes

- Shared EGOS content consumed from `/home/enio/.egos`.
- Repo-specific truth: `TASKS.md`, `.windsurfrules`, `.guarani/IDENTITY.md`, `.guarani/PREFERENCES.md`.
- Do **not** publish machine-specific symlinks into public repo.
- Fix governance drift via `egos-gov sync`, not hand-copying.

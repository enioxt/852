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
│
├── src/components/
│   ├── ClarityAnalytics.tsx          # Microsoft Clarity tracking component
│   └── ui/                           # Shared UI components
│
├── sql/
│   ├── schema.sql                    # Supabase schema (chats, messages, insights + RLS)
│
├── AGENTS.md                         # THIS FILE — system map + capabilities + roadmap
├── TASKS.md                          # SSOT for tasks (P0/P1/P2)
├── README.md                         # Public-facing documentation
└── .windsurfrules                    # Active Windsurf repo rules
```

## Agent 852 — Current Capabilities (v4, 2026-03-13)

| # | Capability | Module | Status |
|---|-----------|--------|--------|
| 1 | AI Chat Streaming (Qwen-plus primary) | `api/chat/route.ts` | Active |
| 2 | Multi-provider fallback (Qwen → Gemini → GPT) | `ai-provider.ts` | Active |
| 3 | Task-based model routing (chat/review/summary/intelligence) | `ai-provider.ts` | Active |
| 4 | ATRiAN Truth Layer (prompt rules, 7 axioms) | `prompt.ts` | Active |
| 5 | ATRiAN Output Validation (post-stream) | `atrian.ts` | Active |
| 6 | PII Auto-Detection (CPF, RG, MASP, plates, etc.) | `pii-scanner.ts` | Active |
| 7 | AI Conversation Review (completeness score) | `api/review/route.ts` | Active |
| 8 | Report Sharing — cross-device (Supabase + localStorage) | `report-store.ts` | Active |
| 9 | Conversation Persistence (localStorage + Supabase) | `chat-store.ts` | Active |
| 10 | Export (PDF/DOCX/Markdown) | `chat/page.tsx` | Active |
| 11 | WhatsApp Sharing | `chat/page.tsx` | Active |
| 12 | Telemetry (Clarity + Supabase + JSON logs) | `telemetry.ts` | Active |
| 13 | Rate Limiting (per-IP) | `rate-limit.ts` | Active |
| 14 | Markdown Rendering (GFM) | `MarkdownMessage.tsx` | Active |
| 15 | Agent Cross-Session Memory (conversation summaries) | `conversation-memory.ts` | Active |
| 16 | AI Intelligence Reports (qwen-max, auto every 5 convos) | `api/ai-reports/generate/route.ts` | Active |
| 17 | Issues / Discussion Board (GitHub-style voting) | `api/issues/route.ts` | Active |
| 18 | Upvote/Downvote with MASP login requirement | `issues/page.tsx` | Active |
| 19 | User Auth (PBKDF2 + Supabase sessions, 30d) | `user-auth.ts` | Active |
| 20 | MASP + Lotação registration (manual validation flow) | `api/auth/register/route.ts` | Active |
| 21 | Dashboard live feed (30s polling, real Recharts metrics) | `dashboard/page.tsx` | Active |
| 22 | Reports ↔ Issues ↔ AI Reports SSOT (bidirectional links) | `supabase.ts` | Active |
| 23 | Seeded police issues (Helios, Olho Vivo, PF integration, etc.) | `sql/seed_issues_v4.sql` | Active |
| 24 | CI pipeline (lint + build + local smoke on push/PR) | `.github/workflows/ci.yml` | Active |
| 25 | Admin validation dashboard for MASP registrations | `admin/validations/page.tsx` | Active |

## Agent 852 — Roadmap

### P1 (Next Sprint)

| # | Feature | Notes |
|---|---------|-------|
| 1 | Issue vote dedup by user_id (not just session_hash) | migration_v4.sql adds user_id FK |
| 2 | PDF/document upload for police issues | multer or presigned S3 |
| 3 | Real notification pipeline (Telegram/webhook on new issue/vote) | fire-and-forget fetch |
| 4 | User-linked conversation persistence (load from Supabase when logged in) | cross-device chat |

### P2 (Backlog)

| # | Feature | Notes |
|---|---------|-------|
| 1 | ATRiAN v2 — NeMo Guardrails or stream-level filtering | Python sidecar |
| 2 | ATRiAN violations dashboard in /admin/telemetry | Admin auth ready |
| 3 | Decompose `chat/page.tsx` into WelcomeScreen + MessageList + InputArea + ExportMenu | ~450 lines |
| 4 | Cross-conversation insight aggregation (themes, patterns, regions) | Supabase aggregation |
| 5 | Tool use: web search for institutional data (AI SDK tools) | DashScope function calling |
| 6 | Voice input (speech-to-text via Browser API) | Web Speech API |
| 7 | Proactive collaboration suggestions (agent suggests topics mid-chat) | Prompt engineering |
| 8 | Automated PDF report from aggregated discussion data | puppeteer/weasyprint |
| 9 | Expand KNOWN_ACRONYMS in atrian.ts with delegacia-specific terms | PII/ATRiAN hardening |

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
        ├── /dashboard → insights com métricas agregadas reais
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

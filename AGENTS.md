# EGOS-KERNEL-PROPAGATED: 2026-05-09
<!-- AUTO-INJECTED by disseminate-propagator.ts — DO NOT EDIT THIS BLOCK MANUALLY -->
<!-- Kernel commit: 4374c36 | 9 rule section(s) changed -->
<!-- Source of rules: egos/AGENTS.md (canonical). Kernel-only authoritative copy: ~/.claude/CLAUDE.md -->
<!-- Re-run: bun ~/egos/scripts/disseminate-propagator.ts --all to update -->
<!-- + CAPABILITY_REGISTRY.md (1 lines) -->
<!-- + CAPABILITY_REGISTRY.md → ## §69 — Central EGOS Template — Marketplace Storefront + Admin (2026-05-08/09) (5 lines) -->
<!-- + CAPABILITY_REGISTRY.md → ### O que é (4 lines) -->
<!-- + CAPABILITY_REGISTRY.md → ### Storefront (cliente final) (9 lines) -->
<!-- + CAPABILITY_REGISTRY.md → ### Admin (dono da loja — protegido por middleware) (8 lines) -->
<!-- + CAPABILITY_REGISTRY.md → ### APIs (6 lines) -->
<!-- + CAPABILITY_REGISTRY.md → ### Componentes `gpecas/` (4 lines) -->
<!-- + CAPABILITY_REGISTRY.md → ### Conexões ao kernel EGOS (6 lines) -->
<!-- + CAPABILITY_REGISTRY.md → ### Gaps (pré-produção) (8 lines) -->

> ⚠️ **PROPAGATED FROM KERNEL** — Edits to this block are overwritten by next `bun governance:sync:exec`.
> Edit kernel `egos/AGENTS.md` section between `<!-- PROPAGATE-RULES-BEGIN -->` and `<!-- PROPAGATE-RULES-END -->` instead.

<!-- === BEGIN KERNEL RULES BODY (auto-injected from egos/AGENTS.md) === -->

## 📋 Canonical Rules (authoritative across ALL IDEs)

This section is the single source of truth for agent rules. Claude Code reads this. Windsurf reads this. Cursor reads this. Codex reads this. GitHub Copilot reads this. When `~/.claude/CLAUDE.md`, `.windsurfrules`, or repo-level `CLAUDE.md` diverge from this file, **AGENTS.md wins**.

### R0 — Critical non-negotiables (irreversible damage prevention)
1. **NEVER `git push --force` to main/master/production** — use `bash scripts/safe-push.sh` (INC-001)
2. **NEVER log/echo/commit secrets** — no `.env`, no hardcoded keys
3. **NEVER publish externally without human approval** — articles, X posts, outreach
4. **NEVER `git add -A` in background agents** — always `git add <specific-file>` (INC-002)
5. **COMMIT TASKS.md immediately** after edit (parallel agents lose uncommitted state)

### R1 — Verification before assertion
1. **Code claims** (function exists, caller count, import usage, dead code, route mapping) → `codebase-memory-mcp` is PRIMARY. Read/Grep is fallback for docs/config/markdown only. If `cbm-code-discovery-gate` hook fires, load MCP tools via ToolSearch; never bypass.
2. **External LLM paste** (ChatGPT/Gemini/Grok/Kimi/Perplexity output) → every named feature, commit, file, version = UNVERIFIED CLAIM. Classify REAL/CONCEPT/PHANTOM via `git log --grep` + `Glob`. High-density buzzword lists (8+ capitalized "systems") = phantom signal (INC-005).
3. **Subagent audits** (Agent/Explore/Plan outputs) = SYNTHESIS, not evidence. Before citing in commit/SSOT edit: re-verify top 3 structural claims via `codebase-memory-mcp`. Absolute audit claims ("X doesn't exist", "Y is skeleton") without file:line anchor = PHANTOM until verified (INC-006).
4. **When spawning Agent/Explore/Plan** → prompt MUST include: "return evidence tuples `{claim, evidence_path, evidence_line}`; prefix unanchored with `UNVERIFIED:`".

### R2 — SSOT integrity
1. **Scored SSOT tables** (columns: `Compliance`/`Score`/`%`/`Coverage`/`Maturity`/`Readiness`/`Grade`) MUST be wrapped in `<!-- AUTO-GEN-BEGIN:<agent> -->` / `<!-- AUTO-GEN-END -->` populated by a compliance agent, OR every row MUST carry `VERIFIED_AT` + `method` + `evidence` (file:line or cmd output SHA). Handwritten scored tables are PHANTOM VECTORS. Pre-commit blocks after MSSOT-002 ships (INC-006).
2. **Use-case scoped scoring** — before applying a uniform rubric across products, declare each product's primary use case. Mark rubric rows REQUIRED/OPTIONAL/N/A per use case. `N/A (use case: X)` is valid, not a fail. Cannot use single score column across heterogeneous use cases (INC-006).
3. **ONE SSOT per domain** — see "SSOT Map" section below. New content goes to existing SSOT, never new file. Prohibited: `docs/business/`, `docs/sales/`, `docs/notes/`, `docs/tmp/`, timestamped docs, `AUDIT*.md`, `REPORT*.md`, `DIAGNOSTIC*.md` (except in `_archived/`).
4. **Evidence-first** — every claim in durable docs (README, SSOT, article) needs: automated test exercising it, metric confirming the number, entry in manifest (`.egos-manifest.yaml` or `CAPABILITY_REGISTRY.md`), or dashboard tile. Unproven claims marked `unverified:`.

### R3 — Edit safety
1. Read before Edit (at least the relevant section). Confirm exact string. Re-read after edit.
2. Max 3 edits per file before verification read.
3. Rename/signature change → grep all callers first.
4. Large files (>300 LOC): remove dead code first (separate commit), break into phases (max 5 files).
5. **Simplicity First (Karpathy):** minimum code that solves. No speculative abstractions. Wait for 3rd repetition before extracting. Test: "Would a senior engineer call this overcomplicated?"

### R4 — Git safety
1. Force-push forbidden on main/master/production/prod/release/hotfix. Exception: `EGOS_ALLOW_FORCE_PUSH=1` in shell only.
2. Always `bash scripts/safe-push.sh <branch>` (fetch+rebase+retry).
3. `.husky/pre-push` blocks non-FF. Answer = `git fetch && git rebase`, never `--no-verify`.

### R5 — Context & swarm
1. Use Agent tool when: 5+ files to read, >3 Glob/Grep rounds expected, research+implement needed. Don't spawn for single-file edits, git ops, known answers.
2. Independent tasks → all agents in ONE message. Dependent → sequential.
3. After 10+ turns or compaction: re-read TASKS.md + current file.
4. Cost control: 3 retries fail on same error → STOP, flag `[BLOCKER]`.
5. **Session checkpoint:** when pre-commit emits `[CHECKPOINT-NEEDED]` (turns≥10/commits≥15/elapsed≥90min), invoke `/checkpoint` (Hard Reset). Use `bun scripts/session-init.ts --status` to check. Never ignore [CHECKPOINT-NEEDED].

### R6 — Incident-driven (always load when relevant)
| Incident | Rule |
|---|---|
| INC-001 | Force-push protocol — `bash scripts/safe-push.sh` |
| INC-002 | Git swarm — `git add <specific>`, commit TASKS.md first |
| INC-003 | TASKS.md — verify artifact before adding, mark `[x]` same commit |
| INC-004 | Supabase Realtime quota — rate limiter + retention |
| INC-005 | External LLM narrative — classify REAL/CONCEPT/PHANTOM |
| INC-006 | RLS policy role validation (28 tables `{public}`) — see R-RLS-001; subagent phantoms + scored SSOT tables — see R1.3, R2.1-2 |
| INC-007 | API key exposure via `|| fallback` pattern — never commit secrets |
| INC-008 | Phantom compliance stubs — see R7 below |

Full postmortems: `docs/INCIDENTS/INC-XXX-*.md`. Index: `docs/INCIDENTS/INDEX.md`.

### R-RLS-001 — Row-Level Security (INC-006, 2026-05-05)
Every RLS policy MUST have explicit `TO <role>`. No `{public}` on sensitive tables (`users`, `*_keys`, `*_secrets`, `admin_*`). Validator: `scripts/security/rls-validator.ts`. Continuous auditor: `scripts/security/rls-auditor-comprehensive.ts` (VPS cron daily 2 AM UTC). Setup: `docs/jobs/SUPABASE_RLS_AUDIT_SETUP.md`. Override: `RLS-POLICY-OVERRIDE: <reason>`.

### R7 — Behavioral eval required for claimed capabilities (INC-008, 2026-04-22)

**Rule:** Any capability a system claims (in manifest, README, docs, CAPABILITY_REGISTRY, or `/api/*/discover` response) MUST have a **behavioral eval** proving it at runtime.

- **"Behavioral"** = simulates real usage (full input→output pipeline), not shape assertions on pure functions.
- Unit test of `detectPII()` returning correct findings is **NOT** enough — it doesn't prove `detectPII()` is being called in the code path that claims PII masking.
- Golden case that POSTs a chat message containing a CPF and asserts the response has no unmasked CPF **IS** behavioral.

**Why (INC-008, 2026-04-22):** Intelink's `lib/shared.ts` exported stub implementations of `scanForPII`/`sanitizeText`/`createAtrianValidator` that returned `[]`/unchanged/always-passed. Route imported these expecting real work. Manifest claimed `pii-masking` + `atrian-validation`. Type checker, linter, 151 unit tests all green. For weeks/months, PII leaked in every production response. Golden eval's first live run caught it in 1 day.

**How to apply:**
1. **New capability in manifest/README → ≥3 golden cases before merge.** If the capability is `X`, at least one case must be designed so that if the underlying code were a stub, the case would fail.
2. **Stubs in compliance/safety code paths are FORBIDDEN in main.** Use `throw new Error('NOT IMPLEMENTED — see TODO-XXX')` during refactors so CI fails loudly, not a silent no-op returning `[]`/`true`/unchanged input.
3. **`try { compliance() } catch { /* non-fatal */ }` patterns MUST log + alert.** Silent swallow is how stubs hide.
4. **Weekly eval against production.** Pass-rate drop = something regressed silently. See `@egos/eval-runner` + `intelink/tests/eval/` for reference.
5. **Canonical eval harness:** `packages/eval-runner/` (extracted from 852's battle-tested runner + trajectory + judge-LLM). Adopt it, don't reinvent. promptfoo layers on top for YAML cases + redteam (Phase B of EVAL track).

**Pattern to detect in code review:**
- File named `*.shared.ts`, `*.stubs.ts`, `*-placeholder.ts` exporting functions with non-trivial signatures returning trivial defaults
- Capability listed in manifest with no corresponding `tests/eval/golden/*.ts` case
- Green CI + green typecheck + green unit tests but no end-to-end eval

Full postmortem: `docs/INCIDENTS/INC-008-phantom-compliance-stubs.md`.
Canonical eval strategy: `docs/knowledge/AI_EVAL_STRATEGY.md` (being written — see EVAL-X2).

<!-- === END KERNEL RULES BODY === -->

---

# AGENTS.md — 852 Inteligência

> **VERSION:** 3.2.0 | **UPDATED:** 2026-04-09
> **TYPE:** Next.js production chatbot + report sharing + EGOS-governed public repo

---

<!-- llmrefs:start -->

## LLM Reference Signature

- **Role:** workspace map + deploy surface + governance entrypoint
- **Summary:** Public anonymous institutional intelligence chatbot for Civil Police officers in Minas Gerais. Features AI-powered chat, PII detection, conversation review, report sharing, smart correlation engine, trending community topics (Papo de Corredor), and ATRiAN ethical validation. Deployed on Hetzner VPS, governed by the EGOS mesh.
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
| **Kernel SSOT Registry** | `/home/enio/egos/docs/SSOT_REGISTRY.md` |
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
│   ├── api/auth/generate-nickname/   # GET  /api/auth/generate-nickname — random codenames
│   ├── api/auth/validate-name/       # POST /api/auth/validate-name — AI real-name blocker
│   ├── api/leaderboard/route.ts      # GET  /api/leaderboard — anonymous reputation board
│   ├── api/upload/parse/route.ts     # POST /api/upload/parse — file parsing for suggestions
│   ├── api/review/route.ts           # POST /api/review — AI conversation analysis
│   ├── api/report/route.ts           # POST /api/report — AI HTML report generation
│   ├── api/correlate/route.ts        # POST /api/correlate — AI tag extraction + issue/report search
│   ├── api/conversations/route.ts    # GET  /api/conversations — conversation history persistence
│   ├── api/extract/route.ts          # POST /api/extract — AI topic content extraction
│   ├── api/hot-topics/route.ts       # GET  /api/hot-topics — trending topics by engagement score
│   ├── api/telemetry/route.ts        # GET  /api/telemetry — stats from Supabase
│   ├── chat/page.tsx                 # Main chat UI (orchestrator, delegates to components)
│   ├── sugestao/page.tsx             # Free-text suggestion flow with upload, PII and ATRiAN preview
│   ├── legislacao/page.tsx           # Legal library + operational glossary
│   ├── papo-de-corredor/page.tsx    # Trending community topics (hot topics)
│   ├── reports/page.tsx              # Shared reports + AI report generator (tabs)
│   ├── dashboard/page.tsx            # Insights dashboard (Recharts)
│   ├── admin/telemetry/page.tsx      # Admin telemetry + ATRiAN violations dashboard
│   ├── conta/page.tsx                # Centralized User Account + Admin Portal
│   ├── ethik/page.tsx                # ATRiAN compliance overview
│   ├── privacidade/page.tsx          # Privacy policy (LGPD)
│   ├── qr/page.tsx                   # QR Code generator
│   ├── verificar-email/page.tsx      # Email verification
│   ├── layout.tsx                    # Root layout (metadata, Clarity, fonts)
│   └── page.tsx                      # Landing page
│
├── src/components/chat/
│   ├── Sidebar.tsx                   # History sidebar + nav (Home, Reports, FAQ)
│   ├── FAQModal.tsx                  # FAQ modal
│   ├── MarkdownMessage.tsx           # GFM markdown rendering
│   ├── ReportReview.tsx              # 3-step report review modal (PII → AI → Share)
│   ├── WelcomeScreen.tsx             # Welcome state with quick actions
│   ├── MessageList.tsx               # Message rendering + getMessageText utility
│   ├── ChatInputArea.tsx             # Chat input form
│   └── ExportMenu.tsx                # PDF/DOCX/MD export + WhatsApp share
│
├── src/components/
│   ├── MobileNav.tsx                 # Mobile bottom navigation (6 tabs, safe-area)
│   ├── CorrelationPanel.tsx          # Smart correlation: AI tags + related issues/reports
│   ├── HotTopicsTicker.tsx           # Trending topics sidebar widget
│   ├── ClarityAnalytics.tsx          # Microsoft Clarity tracking component
│   └── ui/                           # Shared UI components
│
├── src/lib/
│   ├── admin-auth.ts               # Admin authentication
│   ├── ai-provider.ts               # Shared AI provider config (DRY)
│   ├── atrian.ts                     # ATRiAN ethical validation (90+ known acronyms)
│   ├── chat-store.ts                 # localStorage conversation persistence
│   ├── pii-scanner.ts               # PII detection (CPF, RG, MASP, phone, email, REDS, plates, names)
│   ├── prompt.ts                     # Agent 852 system prompt + truth layer
│   ├── nickname-generator.ts         # Police-themed anonymous nickname generator
│   ├── name-validator.ts             # AI name validation (Gemini Flash via OpenRouter)
│   ├── gamification.ts               # Points, ranks (Recruta-Comissário), leaderboard
│   ├── rate-limit.ts                 # In-memory rate limiting
│   ├── report-store.ts              # localStorage report persistence (Supabase-ready)
│   ├── suggestion-store.ts           # localStorage drafts/history for direct suggestions
│   ├── correlate.ts                  # Supabase search for related issues/reports
│   ├── telemetry.ts                  # Dual telemetry: Supabase + structured JSON logs
│
├── sql/
│   ├── schema.sql                    # Supabase schema (chats, messages, insights + RLS)
│
├── AGENTS.md                         # THIS FILE — system map + capabilities + roadmap
├── TASKS.md                          # SSOT for tasks (P0/P1/P2)
├── README.md                         # Public-facing documentation
└── .windsurfrules                    # Active Windsurf repo rules
```

## Agent 852 — Current Capabilities (v6, 2026-03-13)

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
| 9 | Conversation Persistence (localStorage + Supabase + auth hydration) | `chat-store.ts` | Active |
| 10 | Export (PDF/DOCX/Markdown) | `ExportMenu.tsx` | Active |
| 11 | WhatsApp Sharing | `ExportMenu.tsx` | Active |
| 12 | Telemetry (Clarity + Supabase + JSON logs) | `telemetry.ts` | Active |
| 13 | Rate Limiting (per-IP) | `rate-limit.ts` | Active |
| 14 | Markdown Rendering (GFM) | `MarkdownMessage.tsx` | Active |
| 15 | Agent Cross-Session Memory (conversation summaries) | `conversation-memory.ts` | Active |
| 16 | AI Intelligence Reports (qwen-max, auto every 5 convos) | `api/ai-reports/generate/route.ts` | Active |
| 17 | Issues / Discussion Board (GitHub-style voting) | `api/issues/route.ts` | Active |
| 18 | Upvote/Downvote with MASP login + dedup por `user_id` | `issues/page.tsx` | Active |
| 19 | User Auth (PBKDF2 + Supabase sessions, 30d) | `user-auth.ts` | Active |
| 20 | MASP + Lotação registration (manual validation flow) | `api/auth/register/route.ts` | Active |
| 21 | Dashboard live feed (30s polling, real Recharts metrics) | `dashboard/page.tsx` | Active |
| 22 | Reports ↔ Issues ↔ AI Reports SSOT (bidirectional links) | `supabase.ts` | Active |
| 23 | Seeded police issues (Helios, Olho Vivo, PF integration, etc.) | `sql/seed_issues_v4.sql` | Active |
| 24 | CI pipeline (lint + build + local smoke on push/PR) | `.github/workflows/ci.yml` | Active |
| 25 | Admin validation dashboard for MASP registrations | `admin/validations/page.tsx` | Active |
| 26 | Notificações operacionais por webhook/Telegram para `/issues` | `notifications.ts` | Active |
| 27 | ATRiAN violations dashboard (score, categories, severity) | `admin/telemetry/page.tsx` | Active |
| 28 | Componentized chat UI (WelcomeScreen, MessageList, InputArea, ExportMenu) | `components/chat/*` | Active |
| 29 | Anonymous Identity System (police-themed nickname generator) | `nickname-generator.ts` | Active |
| 30 | AI Name Validator (blocks real names via Gemini Flash / OpenRouter) | `name-validator.ts` | Active |
| 31 | Email Verification Flow (Resend API + token hashing) | `user-auth.ts` | Active |
| 32 | Gamification (points, police ranks Recruta-Comissário, leaderboard) | `gamification.ts` | Active |
| 33 | Mobile Bottom Navigation (6-tab fixed bar, safe-area) | `MobileNav.tsx` | Active |
| 34 | Leaderboard API (anonymous, ranked by reputation points) | `api/leaderboard/route.ts` | Active |
| 35 | Copy rules enforcement (no em-dashes in public copy) | Global | Active |
| 36 | Sugestão direta com texto livre, anexos e publicação em `/issues` | `sugestao/page.tsx` | Active |
| 37 | Parsing de PDF, DOC, DOCX, TXT e MD com rate limit | `api/upload/parse/route.ts` | Active |
| 38 | Histórico local de sugestões com rascunho, validação e reabertura | `suggestion-store.ts` | Active |
| 39 | Glossário operacional integrado à biblioteca jurídica | `legislacao/page.tsx` | Active |
| 40 | Roadmap institucional 852 ↔ polícia ↔ Intelink ↔ EGOS Intelligence ↔ IPED | `docs/ROADMAP_INTELIGENCIA_POLICIAL_INTEGRADA.md` | Active |
| 41 | Smart Correlation Engine (AI tag extraction + related issues/reports search) | `api/correlate/route.ts` + `correlate.ts` | Active |
| 42 | CorrelationPanel (debounced AI tags + related content + preview modals) | `CorrelationPanel.tsx` | Active |
| 43 | Hot Topics API (engagement score = votes + comments + recency) | `api/hot-topics/route.ts` | Active |
| 44 | Papo de Corredor page (trending community topics, ranked feed) | `papo-de-corredor/page.tsx` | Active |
| 45 | HotTopicsTicker sidebar widget (top 6 topics with live polling) | `HotTopicsTicker.tsx` | Active |
| 46 | Autosave visual indicator (green dot + timestamp in /sugestao) | `sugestao/page.tsx` | Active |
| 47 | AI Topic Content Engine (Journalistic Titles & Structural Insights) | `api/extract/route.ts` | Active |
| 48 | Anti-Spam Intelligence Filter (blocks trivial chats) | `api/review/route.ts` + `prompt.ts` | Active |
| 49 | Centralized Vibe Coding User Account + Admin Portal | `conta/page.tsx` | Active |
| 50 | ETHIK Agent: x402 Payment Gateway & Tokenomics Engine | `src/lib/ethik-agent.ts` | Active |
| 51 | GCP Dynamic API Keys (Quota-restricted Ephmeral Keys) | `src/lib/gcp-keys.ts` | Active |
| 52 | ATRiAN CLI Scanner & Standalone Engine | `packages/atrian/` | Active |
| 53 | ATRiAN Stream Filter + Abort Signal (CHAT-001+007) | `api/chat/route.ts` | Active |
| 54 | Per-identity rate-limit budget by tier (CHAT-008) | `rate-limit.ts` | Active |
| 55 | Schema-driven Prompt Assembler — modular system prompt (CHAT-003) | `prompt-assembler.ts` | Active |
| 56 | Tira-Voz eval: 20 golden test cases + automated eval runner (CHAT-009) | `eval/` | Active |
| 57 | PII parity with Guard Brasil v0.2.0 (CNPJ, SUS, NIS/PIS, TRE, CEP) | `pii-scanner.ts` | Active |
| 58 | .egos-manifest.yaml doc-drift claims (DRIFT-010) | `.egos-manifest.yaml` | Active |
| 59 | **MasterReportModal v2.0** — Modal 75% tela, 1 clique do card na landing | `MasterReportModal.tsx` | Active |
| 60 | **Tecla ESC** — Fecha modal com Escape key | `MasterReportModal.tsx` | Active |
| 61 | **Swipe to close** — Puxe para baixo no topo para fechar (mobile) | `MasterReportModal.tsx` | Active |
| 62 | **Focus trap** — Acessibilidade, foco circula dentro do modal | `MasterReportModal.tsx` | Active |
| 63 | **Loading skeleton** — Animação pulse durante carregamento | `MasterReportModal.tsx` | Active |
| 64 | **Hot Topics Sidebar** — Tópicos em alta integrados ao modal (desktop) | `MasterReportModal.tsx` | Active |
| 65 | **Version History API** — `/api/ai-reports/master/history` + `/[version]` | `api/ai-reports/master/history/` | Active |
| 66 | **Histórico no modal** — Abas "Tópicos" / "Histórico" no sidebar | `MasterReportModal.tsx` | Active |
| 67 | **View versions** — Visualizar versões anteriores do relatório | `MasterReportModal.tsx` | Active |
| 68 | **Simplificação ReportsFeed** — Removido "Relatos Compartilhados" e "Gerador" | `ReportsFeed.tsx` | Active |

## Agent 852 — Roadmap

### P1 (Next Sprint)

| # | Feature | Notes |
|---|---------|-------|
| 1 | Espiral de Escuta (reports <85% approval reopen discussion) | AI re-analysis loop |
| 2 | Histórico remoto de sugestões para usuários autenticados | Supabase drafts + status sync |
| 3 | LGPD consent banner + self-service data access | Lei 13.709/2018 |
| 4 | Templates de relato e roteamento formal | sugestão, denúncia formal, triagem reservada |
| 5 | Correlation in /chat (trigger after AI response) | Reuse CorrelationPanel |
| 6 | AI summaries in Papo de Corredor (weekly digest) | qwen-plus aggregation |

### P2 (Backlog)

| # | Feature | Notes |
|---|---------|-------|
| 1 | ATRiAN v2: NeMo Guardrails or stream-level filtering | Python sidecar |
| 2 | Cross-conversation insight aggregation (themes, patterns, regions) | Supabase aggregation |
| 3 | Tool use: web search for institutional data (AI SDK tools) | DashScope function calling |
| 4 | Voice input (speech-to-text via Browser API) | Web Speech API |
| 5 | BYOK: users plug own API keys, shared key groups | Model transparency |
| 6 | Automated PDF report from aggregated discussion data | puppeteer/weasyprint |
| 7 | Intake institucional → triagem → caso → grafo | integração 852 + polícia + Intelink |

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
  ├── "Escrever direto" → /sugestao
  │     ├── Texto livre + categoria + tags
  │     ├── Upload de PDF/DOC/DOCX/TXT/MD
  │     ├── PII scanner + ATRiAN preview
  │     ├── Smart Correlation (AI tags + related issues/reports)
  │     ├── Revisão automática opcional
  │     ├── Export em PDF/Markdown
  │     ├── Autosave local com indicador visual
  │     └── Publicação final em /issues
  │
  ├── "Papo de Corredor" → /papo-de-corredor
  │     ├── Top 3 featured topics (medal ranking)
  │     ├── Full ranked list by engagement score
  │     ├── Category summary badges
  │     ├── 2-minute auto-refresh
  │     └── CTAs → /sugestao, /chat
  │
  ├── "Biblioteca Jurídica" → /legislacao
  │     ├── Leis e normativas por categoria
  │     └── Glossário operacional com siglas recorrentes
  │
  ├── "Ver relatórios" → /reports
  │     ├── Tab: Relatos Compartilhados → view/delete shared reports
  │     └── Tab: Gerador de Relatórios → AI HTML report from prompt
  │
  └── Internal pages
        ├── /issues → discussion board with voting + comments
        ├── /dashboard → insights com métricas agregadas reais
        └── /admin/telemetry → KPIs, model usage, events
```

## Deploy Surface

| Layer | Value |
|------|-------|
| **VPS** | Hetzner (204.168.217.125) |
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
  --exclude='.guarani/prompts' --exclude='.guarani/refinery' ./ hetzner:/opt/852/
ssh hetzner "cd /opt/852 && docker compose build --no-cache && docker compose up -d --force-recreate"

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


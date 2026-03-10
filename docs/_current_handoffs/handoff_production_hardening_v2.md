# 🔄 HANDOFF — Production Hardening v2 + Review + Canonical Workflow

**Repo:** 852
**Date:** 2026-03-10T20:55:00Z
**Agent:** Windsurf/Cascade
**Commits:** 6 (this session) + 4 (previous session)

---

## 📊 Summary

Completed the second layer of production hardening for the 852 chatbot. Reverse-engineered the entire first hardening conversation into reusable scripts, workflows, and rules. This session added: canonical EGOS workflow for VPS+Caddy chatbots, landing page layout fix, DRY refactor of AI provider logic, rate limiting on `/api/report`, and full review of componentization/modularization/docs. Production is live and verified at `852.egos.ia.br`.

## 🔍 Key Files Changed

```
src/lib/ai-provider.ts              ← NEW: shared provider/model/pricing (was duplicated 3x)
src/app/api/chat/route.ts           ← Refactored to use shared module
src/app/api/chat/info/route.ts      ← Refactored to use shared module
src/app/api/report/route.ts         ← Refactored + added rate limiting + provider check + fixed error typing
src/app/page.tsx                    ← Landing page layout fix (centering, stacking, sizes)
TASKS.md                            ← Updated backlog with review findings
~/.egos/workflows/chatbot-vps-hardening.md  ← NEW: canonical EGOS workflow
scripts/verify_local_prod.sh        ← NEW: local production verification wrapper
scripts/verify_rate_limit.py        ← Fixed idempotency (unique IP per run)
scripts/release_contabo.sh          ← Simplified to use verify wrapper
docs/CHATBOT_PRODUCTION_REVERSE_ENGINEERING.md ← Updated playbook
.windsurf/workflows/chatbot-production-hardening.md ← Local workflow
```

## 🏗️ Architecture State

```
src/lib/
├── ai-provider.ts    ← SSOT for provider selection, model ID, pricing
├── chat-store.ts     ← localStorage persistence
├── ethik.ts          ← Mock ETHIK leaderboard data
├── prompt.ts         ← Agent 852 system prompt
└── rate-limit.ts     ← In-memory sliding window rate limiter

src/app/api/
├── chat/route.ts     ← Hardened: validation + rate limit (12/5min) + streaming
├── chat/info/route.ts ← Model metadata endpoint
└── report/route.ts   ← Hardened: validation + rate limit (6/10min) + provider check

src/components/chat/
├── Sidebar.tsx       ← Collapsible conversation history
├── FAQModal.tsx      ← Privacy FAQ modal
└── MarkdownMessage.tsx ← GFM markdown rendering
```

## 🚀 Next Priorities

- [ ] P1: Decompose `chat/page.tsx` (395 lines) — extract WelcomeScreen, MessageList, InputArea, ExportMenu
- [ ] P1: Sync repo público GitHub com últimas mudanças (landing fix, refactor, hardening)
- [ ] P2: CI/CD pipeline (lint + build + smoke on push/PR)
- [ ] P2: Supabase real + RLS para persistência server-side
- [ ] P2: Dashboard com métricas reais (substituir mock data)
- [ ] P2: Refinar OG image para proporção 1200x630 real
- [ ] P2: Consolidar package manager (remover vestígios de bun, manter npm)

## ⚠️ Alerts

1. **Production is LIVE** — `852.egos.ia.br` serving real users. Any breaking change to `/api/chat` or chat UI affects production immediately after deploy.
2. **API key: DashScope** — Primary LLM. If it expires, fallback is OpenRouter Gemini (paid). Check `.env` on VPS `/opt/852/.env`.
3. **Rate limiter is in-memory** — resets on container restart. Fine for current scale, but if traffic grows, consider Redis or Supabase-backed rate limiting.
4. **VPS is NOT a git repo** — deploy via `rsync` only. Never `git pull` on VPS. Use `npm run release:prod` for one-command deploy.
5. **`chat/page.tsx` is monolithic** — 395 lines. Functional but should be decomposed before adding features.
6. **Dashboard/ETHIK/Reports pages** use mock data — they render but are not connected to real backends yet.
7. **Canonical workflow** created at `~/.egos/workflows/chatbot-vps-hardening.md` — applies to ANY future VPS+Caddy+anonymous chatbot in the EGOS ecosystem.

## 🏁 Quick Start

```bash
cd /home/enio/852

# Local dev
npm run dev

# Full local production verification (build + smoke + rate limit)
npm run verify:local-prod

# One-command production release
npm run release:prod

# Governance
npm run governance:check
npm run governance:sync
```

## 📋 Review Findings (for next agent)

### What's Good
- **Componentization**: Sidebar, FAQModal, MarkdownMessage well-separated
- **Lib modules**: Clean single-responsibility (chat-store, rate-limit, prompt, ethik, ai-provider)
- **Governance**: IDENTITY, PREFERENCES, AGENTS.md, TASKS.md all well-maintained
- **Scripts**: Smoke tests, rate-limit verification, release automation all working
- **Security**: Rate limiting on all public routes, payload validation, no PII retention

### What Needs Work
- **chat/page.tsx monolith**: Should extract 4-5 sub-components
- **Mock data**: Dashboard, ETHIK, Reports all use hardcoded mock data
- **No CI/CD**: All validation is manual via npm scripts
- **Package manager**: Historical bun artifacts may still exist
- **Recharts warnings**: Build produces width/height warnings (non-blocking)

---
**Signed by:** Windsurf/Cascade — 2026-03-10T20:55:00Z
**Sacred Code:** 000.111.369.963.1618

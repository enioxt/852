# HANDOFF — Smart Correlation + Hot Topics

**Repo:** 852
**Date:** 2026-03-13T13:58:00Z
**Agent:** Windsurf/Cascade
**Commits:** 1 (f8c6e25)

---

## Summary

Implemented two major features: Smart Correlation Engine and Papo de Corredor (Hot Topics).
The correlation engine uses AI to extract tags from user text and searches Supabase for related issues/reports.
Hot Topics ranks community issues by engagement score (votes, comments, recency).
Both features are fully integrated into navigation, deployed to VPS, and documented.

## Key Files Changed

```
NEW:
  src/app/api/correlate/route.ts        — AI tag extraction + search API
  src/app/api/hot-topics/route.ts       — Trending topics API
  src/lib/correlate.ts                  — Supabase search helper
  src/components/CorrelationPanel.tsx    — AI tags + related content component
  src/components/HotTopicsTicker.tsx     — Sidebar trending widget
  src/app/papo-de-corredor/page.tsx     — Trending topics page

MODIFIED:
  src/lib/ai-provider.ts               — Added correlation task type
  src/app/sugestao/page.tsx             — Integrated CorrelationPanel + HotTopicsTicker + autosave indicator
  src/components/MobileNav.tsx          — Added Corredor tab
  src/components/chat/Sidebar.tsx       — Added Corredor link
  AGENTS.md                            — v3.0 (capabilities 41-46)
  TASKS.md                             — Sprint v7 completed
  README.md                            — Full overhaul
```

## Next Priorities

- [ ] P1: Correlation in /chat (trigger after AI response, reuse CorrelationPanel)
- [ ] P1: AI summaries in Papo de Corredor (weekly digest via qwen-plus)
- [ ] P1: Espiral de Escuta (reports <85% approval reopen discussion)
- [ ] P1: LGPD consent banner + self-service data access
- [ ] P2: Templates de relato e roteamento formal

## Alerts

- `ai-provider.ts` now has 7 task types: chat, review, html_report, intelligence_report, conversation_summary, name_validation, correlation
- CorrelationPanel is ready to be reused in /chat — just pass text + tag handlers
- HotTopicsTicker polls every 3 minutes; Papo de Corredor refreshes every 2 minutes
- MobileNav now has 6 tabs (replaced Leis with Corredor)

## Quick Start

```bash
cd /home/enio/852
npm run dev
# VPS is already deployed and running (200 OK on all routes)
```

---
**Signed by:** Cascade — 2026-03-13T13:58:00Z

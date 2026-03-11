# 🔄 HANDOFF — Tira-Voz Branding + Security Hardening

**Repo:** 852
**Date:** 2026-03-15T15:10:00Z
**Agent:** Cascade/Windsurf
**Commits:** 1 (1f0ec74)

---

## 📊 Summary

Rebranded the chatbot agent from "852 Inteligência" to "Tira-Voz" across all user-facing surfaces (header, footer, WhatsApp, reports, system prompt, metadata). Added security hardening: rate limiting on login (5/15min) and register (3/30min) endpoints, password minimum raised to 8 chars. Researched Lei Orgânica da PCMG (LC 129/2013) and added comprehensive content protection rules to the system prompt — blocking individual conduct reports, redirecting discipline complaints to Corregedoria/Ouvidoria, and declaring the platform is NOT a substitute for official PCMG intelligence channels. Added LGPD privacy layer and lotação auto-detect rules. Created Sprint v5 in TASKS.md with 9 new feature tasks. Built ClipMon clipboard manager for Ubuntu.

## 🔍 Key Files Changed

```
src/lib/prompt.ts              — Tira-Voz identity + Lei Orgânica + LGPD + lotação rules
src/app/api/auth/login/route.ts — Rate limiting (5/15min per IP)
src/app/api/auth/register/route.ts — Rate limiting (3/30min) + password min 8
src/lib/telemetry.ts           — Added 'rate_limited' event type
src/app/chat/page.tsx          — Header: "Tira-Voz"
src/components/chat/*.tsx      — WhatsApp shares, footer, sidebar updated
src/app/reports/page.tsx       — Footer + example prompts
src/app/api/report/route.ts    — Report generation prompt
TASKS.md                       — Sprint v5 with 9 new tasks
```

## 🚀 Next Priorities

- [ ] P0: Email verification flow (Resend/Supabase Edge) — currently NO email confirmation exists
- [ ] P1: Espiral de Escuta — iterative report approval with 85% threshold + 5 votes
- [ ] P1: Report flow multi-camada (AI analysis → human review → voting)
- [ ] P1: Free-text report mode on landing page (text/doc/pdf/audio upload)
- [ ] P1: LGPD consent banner on registration
- [ ] P2: Audio transcription (Web Speech API / Whisper)
- [ ] P2: Suggest external LLMs for report polishing

## ⚠️ Alerts

1. **NO email confirmation exists** — users register with any email and get 'pending' status. MASP validation is manual only. This is a security gap for P0.
2. **Password minimum was 6, now 8** — existing users with 6-7 char passwords can still login but won't be prompted to change.
3. **Windsurf memories**: 379 .pb files (1.6MB) in `~/.codeium/windsurf/memories/` — consider pruning stale entries.
4. **ClipMon** running at `/home/enio/clipmon/` with autostart enabled.
5. **Landing page** was refactored in this session (page.tsx got layout/branding changes).

## 🏁 Quick Start

```bash
cd /home/enio/852
npm run dev
# VPS is already deployed with latest commit 1f0ec74
curl -I https://852.egos.ia.br  # should return 200
```

---
**Signed by:** Cascade — 2026-03-15T15:10:00Z

# 🔄 HANDOFF — Chat Fix + Full Telemetry System

**Repo:** 852
**Date:** 2026-03-10T22:35:00Z
**Agent:** Windsurf/Cascade
**Commits:** 2

---

## 📊 Summary

Fixed critical production chat bug where messages were never answered (stream protocol mismatch between `ai` SDK v6 server and `@ai-sdk/react` v1.1.25 client). Then researched telemetry across entire EGOS ecosystem (6 repos + VPS) and implemented a full observability stack for 852: Microsoft Clarity integration, Supabase-backed telemetry persistence, structured JSON console logs, and an admin dashboard at `/admin/telemetry`.

## 🔍 Root Cause — Chat Bug

- **Server:** `ai` SDK v6 only has `toUIMessageStreamResponse()` — sends `text/event-stream` with UI message protocol
- **Client:** `@ai-sdk/react` v1.1.25 `useChat` defaults to `streamProtocol: 'data'` — expects the old data stream format
- **Neither side supported the other's format** — client silently failed to parse the stream
- **Fix:** Switched to `toTextStreamResponse()` (server) + `streamProtocol: 'text'` (client) — compatible across both versions
- **Attempted:** Upgrading `@ai-sdk/react` to v3.0.118 but it has completely different API (no `input`, `handleInputChange`, etc.) — too much migration

## 🔍 Key Files Changed

```
src/app/api/chat/route.ts         — toTextStreamResponse + telemetry wiring
src/app/chat/page.tsx             — streamProtocol:'text' + onError logging
src/lib/telemetry.ts              — NEW: dual Supabase + JSON log telemetry module
src/components/ClarityAnalytics.tsx — NEW: Microsoft Clarity script loader
src/app/layout.tsx                — Added ClarityAnalytics component
src/app/api/telemetry/route.ts    — NEW: stats endpoint for dashboard
src/app/admin/telemetry/page.tsx  — NEW: full admin dashboard
migrations/001_telemetry_table.sql — NEW: Supabase table DDL
package.json                      — Added @supabase/supabase-js
TASKS.md                          — Updated with completed items
```

## 🔬 Telemetry Research Findings

| System | What exists | Status |
|--------|------------|--------|
| **852** | console.log only → NOW: Clarity + Supabase + JSON logs + dashboard | ✅ Implemented |
| **Intelink** | Full telemetry: Supabase `intelink_telemetry`, API, admin UI, export | Exists |
| **Carteira Livre** | Observability: `volante_system_logs`, KPIs, AI insights, activity | Exists |
| **EGOS Web** | Clarity + GA4 (`useObservability.ts`), AI cost transparency | Exists |
| **BR-ACC** | Caddy CSP allows Clarity, Analytics page | Partial |
| **VPS** | Caddy logs, Docker healthchecks | Minimal |

## 🚀 Next Priorities

- [ ] P1: Activate Supabase — create `telemetry_852` table (migration ready), add env vars
- [ ] P1: Create Microsoft Clarity project and set `NEXT_PUBLIC_CLARITY_ID`
- [ ] P2: Supabase persistence for chat conversations (replace localStorage)
- [ ] P2: Decompose `chat/page.tsx` (395 lines)
- [ ] P2: CI/CD pipeline

## ⚠️ Alerts

1. **`@ai-sdk/react` v1.1.25 is pinned** — do NOT upgrade to v3+ without full API migration (breaking changes: no `input`, `handleInputChange`, `handleSubmit`, `isLoading`, `error`, `setMessages`)
2. **Telemetry gracefully degrades** — without Supabase env vars, all events go to structured console logs only. Run `docker logs 852-app | grep '852-telemetry'` to see them.
3. **Clarity needs project ID** — visit https://clarity.microsoft.com, create project, add `NEXT_PUBLIC_CLARITY_ID=xxxxx` to `.env`
4. **Admin dashboard is public** — no auth. Consider adding basic auth or IP restriction before sharing the URL.

## 🏁 Quick Start

```bash
cd /home/enio/852
npm run dev  # local dev on port 3100

# View production telemetry
ssh contabo "docker logs 852-app --tail 50 2>&1 | grep '852-telemetry'"

# Deploy
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.env' --exclude='.git' \
  --exclude='.egos' --exclude='.agent' --exclude='.windsurf' \
  --exclude='.guarani/orchestration' --exclude='.guarani/philosophy' \
  --exclude='.guarani/prompts' --exclude='.guarani/refinery' ./ contabo:/opt/852/
ssh contabo "cd /opt/852 && docker compose build --no-cache && docker compose up -d --force-recreate"
```

---
**Signed by:** Windsurf/Cascade — 2026-03-10T22:35:00Z

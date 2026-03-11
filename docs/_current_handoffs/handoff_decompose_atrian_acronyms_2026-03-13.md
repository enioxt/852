# 🔄 HANDOFF — Chat Decomposition + ATRiAN Dashboard + Acronyms

**Repo:** 852
**Date:** 2026-03-13T18:00:00Z
**Agent:** Windsurf/Cascade
**Commits:** 1 (889141e)

---

## 📊 Summary

Decomposed the monolithic `chat/page.tsx` (605→405 lines) into 4 reusable components: WelcomeScreen, MessageList, ChatInputArea, ExportMenu. Added a dedicated ATRiAN violations section to the admin telemetry dashboard with KPI cards, category/severity breakdown, and recent violations list. Expanded KNOWN_ACRONYMS from ~40 to 90+ entries covering PCMG, justice system, MG state, and technical terms to reduce false-positive warnings.

## 🔍 Key Files Changed

```
NEW:
  src/components/chat/WelcomeScreen.tsx    — Quick actions + welcome (51 lines)
  src/components/chat/MessageList.tsx      — Message rendering + getMessageText (96 lines)
  src/components/chat/ChatInputArea.tsx    — Input form (46 lines)
  src/components/chat/ExportMenu.tsx       — PDF/DOCX/MD export + WhatsApp (92 lines)

MODIFIED:
  src/app/chat/page.tsx                   — Refactored to use extracted components (605→405 lines)
  src/app/admin/telemetry/page.tsx        — Added ATRiAN violations section + atrian_violation badge
  src/lib/telemetry.ts                    — Added AtrianStats interface + aggregation in getStats()
  src/lib/atrian.ts                       — Expanded KNOWN_ACRONYMS (~40→90+ entries)
  AGENTS.md                               — 28 active capabilities, cleaned P2 backlog
  TASKS.md                                — Marked 4 tasks complete (decompose, ATRiAN dashboard, acronyms, pipeline/persistence)
```

## 🚀 Next Priorities

- [ ] P1: PDF/document upload for police issues (multer or presigned S3)
- [ ] P2: Cross-conversation insight aggregation (themes, patterns, regions)
- [ ] P2: ATRiAN v2 — NeMo Guardrails or stream-level filtering
- [ ] P2: Admin view para relatórios compartilhados (autenticado)
- [ ] P2: Tool use — web search for institutional data (AI SDK tools)
- [ ] P2: Refinar OG image para proporção 1200x630 real

## ⚠️ Alerts

- `getMessageText` is now exported from `MessageList.tsx` — any new consumer must import from there
- `ExportMenu.tsx` contains all export dependencies (jsPDF, docx, file-saver) — do NOT add these to chat/page.tsx
- ATRiAN dashboard section only renders when `atrian_violation` events exist in telemetry — invisible if no violations recorded
- TASKS.md: 7 open tasks, 93 completed

## 🏁 Quick Start

```bash
cd /home/enio/852
npm run dev

# Deploy
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.env' --exclude='.git' \
  --exclude='.egos' --exclude='.agent' --exclude='.windsurf' \
  --exclude='.guarani/orchestration' --exclude='.guarani/philosophy' \
  --exclude='.guarani/prompts' --exclude='.guarani/refinery' ./ contabo:/opt/852/
ssh contabo "cd /opt/852 && docker compose build --no-cache && docker compose up -d --force-recreate"
```

---
**Signed by:** Cascade — 2026-03-13T18:00:00Z

# 🔄 HANDOFF — persistence_dashboard_cleanup

**Repo:** 852
**Date:** 2026-03-11T00:00:00Z
**Agent:** Cascade
**Commits:** 0

---

## 📊 Summary
Nesta sessão, o backlog estrutural principal foi atacado sem exigir nova migração de schema: a identidade anônima/autenticada passou a usar `session_hash` como SSOT (`anon:<hash>` / `user:<id>`), o chat ganhou memória persistente via sumários armazenados em `metadata.summary`, o compartilhamento de relatórios virou dual-write (local + servidor) e o `/dashboard` passou a consumir métricas reais do Supabase via `/api/dashboard/public`.

Também foi removida a exposição funcional de ETHIK/gamificação do produto policial: a rota legada `/ethik` agora redireciona para `/dashboard`, os textos do README/AGENTS/TASKS foram limpos e os módulos legados foram neutralizados.

## 🔍 Key Files Changed
```text
src/lib/session.ts
src/lib/conversation-memory.ts
src/lib/supabase.ts
src/lib/chat-store.ts
src/lib/report-store.ts
src/lib/prompt.ts
src/app/api/chat/route.ts
src/app/api/conversations/route.ts
src/app/api/reports/server/route.ts
src/app/api/dashboard/public/route.ts
src/app/chat/page.tsx
src/components/chat/ReportReview.tsx
src/app/reports/page.tsx
src/app/dashboard/page.tsx
src/app/issues/page.tsx
src/app/ethik/page.tsx
README.md
AGENTS.md
TASKS.md
```

## 🚀 Next Priorities
- [ ] P1: Eliminar os warnings SSR do Recharts no build do `/dashboard`
- [ ] P1: Decompor `src/app/chat/page.tsx` em componentes menores
- [ ] P2: Expandir cross-conversation insight aggregation a partir dos sumários persistidos

## ⚠️ Alerts
- `npm run lint` e `npm run build` passam.
- O build ainda emite warnings do Recharts (`width(-1)/height(-1)`) durante prerender do `/dashboard`, mas sem falhar.
- A memória do agente está baseada em sumários salvos em `conversations_852.metadata.summary`; não há tabela nova.
- O dual-write de relatórios usa `serverId` localmente e `metadata.clientConversationId` para reconciliar IDs local/servidor.

## 🏁 Quick Start
```bash
npm run dev
```

---
**Signed by:** Cascade — 2026-03-11T00:00:00Z

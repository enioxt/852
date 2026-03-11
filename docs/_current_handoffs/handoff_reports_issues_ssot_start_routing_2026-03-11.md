# 🔄 HANDOFF — Reports/Issues SSOT + Start Hardening + Model Routing

**Repo:** 852
**Date:** 2026-03-11T00:00:00Z
**Agent:** Cascade
**Commits:** 0

---

## 📊 Summary

Entregue a sincronização real entre `/reports`, `ai_reports_852` e `/issues`, corrigindo o drift de schema das issues para `ai_report_id`, adicionando deduplicação de tópicos recorrentes e links bidirecionais por relatório. A página `/reports` agora expõe uma aba de inteligência com preview do relatório agregado e os issues gerados. O roteamento de modelos foi endurecido por tarefa (`chat`, `review`, `html_report`, `intelligence_report`, `conversation_summary`) para preservar quota e separar cargas premium de cargas auxiliares. O workflow compartilhado `/start` foi fortalecido para carregar `SYSTEM_MAP`, roots de módulos, workflows e deploy surface antes de mudanças amplas.

## 🔍 Key Files Changed

```text
src/lib/supabase.ts
src/app/api/ai-reports/route.ts
src/app/api/ai-reports/generate/route.ts
src/app/api/issues/route.ts
src/app/reports/page.tsx
src/app/issues/page.tsx
src/lib/ai-provider.ts
src/lib/conversation-memory.ts
src/app/api/chat/route.ts
src/app/api/chat/info/route.ts
src/app/api/report/route.ts
src/app/api/review/route.ts
src/app/dashboard/page.tsx
.windsurf/workflows/start.md
.windsurfrules
TASKS.md
```

## 🚀 Next Priorities

- [ ] P1: Implementar pipeline real de notificações do 852 acoplado a eventos críticos (Telegram/Discord/webhook/admin alerts)
- [ ] P1: Expandir cross-conversation insight aggregation (temas, padrões, regiões)
- [ ] P2: Investigar e mitigar `Failed to find Server Action "x"` visto nos logs do `852-app` no VPS

## ⚠️ Alerts

- `npm run lint && npm run build` passaram localmente.
- Warning SSR do Recharts foi eliminado com renderização client-only dos gráficos.
- VPS auditado: `852-app` está `healthy`; PM2 mostra `egos-discord` e `egos-telegram` online.
- `egos-discord` tem atividade real recente em `/opt/egos-bot`; `egos-telegram` aparenta estar online porém o log recente mostra apenas boot/rate limit, sem evidência de trabalho ativo recente.
- O repo 852 ainda não contém um pipeline de notificação operacional próprio; há telemetria, mas não alerting de produto.
- Logs recentes do `852-app` mostraram erros `Failed to find Server Action "x"`, provavelmente ligados a cliente antigo/stale deployment; vale auditar.

## 🏁 Quick Start

```bash
npm run lint && npm run build
```

---
**Signed by:** Cascade — 2026-03-11T00:00:00Z

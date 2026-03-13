# 🔄 HANDOFF — stats, sync, system map

**Repo:** 852
**Date:** 2026-03-11T19:45:00Z
**Agent:** Cascade
**Commits:** 1

---

## 📊 Summary
Nesta sessão, o pipeline de métricas públicas foi corrigido para separar revisão de IA por relato de relatório agregado de inteligência. O gatilho do relatório agregado deixou de usar contagem de conversas e passou a usar relatos compartilhados, que é a unidade correta do produto.

Também foi feito backfill do primeiro tópico automático em `issues_852`, o repo `852` foi registrado no mesh compartilhado do `~/.egos/sync.sh`, os workflows/skills foram sincronizados, e o deploy em produção foi executado com sucesso em `https://852.egos.ia.br`.

## 🔍 Key Files Changed
```text
/home/enio/852/src/lib/supabase.ts
/home/enio/852/src/app/api/ai-reports/generate/route.ts
/home/enio/852/src/app/api/reports/server/route.ts
/home/enio/852/src/app/api/conversations/route.ts
/home/enio/852/src/app/api/stats/route.ts
/home/enio/852/src/app/page.tsx
/home/enio/852/TASKS.md
/home/enio/.egos/sync.sh
```

## 🚀 Next Priorities
- [ ] P0: Aplicar e validar `migration_v4.sql`, `migration_v5.sql` e `migration_v6_gamification.sql` no Supabase do 852
- [ ] P1: Implementar espiral de escuta com schema próprio, regra de moderação e follow-up estruturado
- [ ] P1: Gerar automaticamente o primeiro relatório de inteligência completo quando atingir 5 relatos compartilhados

## ⚠️ Alerts
- O contador de `Relatórios revisados pela IA` representa relatos compartilhados com `review_data`, não relatórios agregados.
- O contador de `Relatórios de inteligência` representa a tabela `ai_reports_852` e ainda está em `0`, o que é coerente com o banco atual.
- O repositório `/home/enio/.egos` recebeu commit local de `sync.sh`, mas não possui `origin` configurado para push automático.
- Existem mudanças locais pré-existentes em `/home/enio/.egos` fora do escopo desta sessão.

## 🏁 Quick Start
```bash
cd /home/enio/852
npm run dev
```

---
**Signed by:** Cascade — 2026-03-11T19:45:00Z

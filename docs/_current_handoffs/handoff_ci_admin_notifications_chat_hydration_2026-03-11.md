# 🔄 HANDOFF — CI, Admin MASP, Notifications, Auth Chat Hydration

**Repo:** 852
**Date:** 2026-03-11T11:44:21Z
**Agent:** Cascade
**Commits:** 5

---

## 📊 Summary

Nesta rodada, o `852` recebeu um bloco coeso de hardening e produto: CI básico com `lint + build + smoke`, consolidação oficial de `npm`, painel admin de validação manual MASP, deduplicação de votos de issues por `user_id`, pipeline opcional de notificações por webhook/Telegram e hidratação automática de conversas do Supabase quando o usuário autenticado entra no `/chat`.

Tudo foi validado localmente com `npm run lint`, `npm run build` e `bash scripts/release_contabo.sh`, e publicado com sucesso em `https://852.egos.ia.br`.

## 🔍 Key Files Changed

```text
.github/workflows/ci.yml
package.json
scripts/smoke_852.sh
scripts/verify_local_prod.sh
src/app/api/chat/route.ts
src/app/admin/telemetry/page.tsx
src/app/admin/validations/page.tsx
src/app/api/admin/validations/route.ts
src/app/api/issues/route.ts
src/app/chat/page.tsx
src/components/chat/Sidebar.tsx
src/lib/chat-store.ts
src/lib/notifications.ts
src/lib/supabase.ts
src/lib/telemetry.ts
AGENTS.md
TASKS.md
README.md
.env.example
```

## 🚀 Next Priorities

- [ ] P1: PDF/document upload para pautas policiais
- [ ] P1: Configurar envs reais de alerta no Contabo (`ISSUE_ALERT_WEBHOOK_URL` e/ou `TELEGRAM_*`) e validar emissão externa
- [ ] P2: Fazer QA manual de login/logout no `/chat` para confirmar troca de histórico entre buckets `anon:` e `user:` em múltiplos dispositivos

## ⚠️ Alerts

- O pipeline de notificações já está ativo no código e na produção, mas só envia alertas externos se os envs opcionais estiverem configurados no VPS.
- O `chat-store` agora é scoped por identidade (`anon:<sessionHash>` / `user:<userId>`). O bucket legado `852-conversations` é migrado transparentemente para o escopo anônimo no primeiro carregamento.
- A hidratação autenticada do `/chat` depende do evento de janela `852-auth-changed`, disparado pelo `Sidebar` em login/logout.
- O pre-commit universal da mesh EGOS continua emitindo avisos heurísticos sobre `.map/.filter/.forEach`, mas sem bloquear commits.

## 🏁 Quick Start

```bash
npm run dev
```

Deploy/validação:

```bash
bash scripts/release_contabo.sh
```

---
**Signed by:** Cascade — 2026-03-11T11:44:21Z

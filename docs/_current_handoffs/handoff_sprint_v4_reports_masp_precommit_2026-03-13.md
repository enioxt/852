# Handoff — Sprint v4 (2026-03-13)

## Commits desta sessão
- `91bcd0d` — feat: sprint v4 — cross-device reports, MASP auth, police issues seed, dashboard polling, pre-commit SSOT
- `29e8242` — docs: update AGENTS.md v4 — 23 capabilities, full roadmap P1/P2

## O que foi entregue

### 1. Relatórios cross-device (RESOLVIDO)
- **Problema:** relatório compartilhado do desktop não aparecia no celular Android
- **Causa raiz:** `loadSharedReportsFromServer` usava `ownOnly=true`, retornando apenas relatórios da sessão atual
- **Fix:** novo `loadAllPublicReports(sessionHash)` em `src/lib/report-store.ts` — busca todos os relatórios públicos + marca `isOwn` comparando com própria sessão
- **Resultado:** relatórios são visíveis em qualquer dispositivo; botão "Apagar" aparece apenas para `isOwn === true`

### 2. Dashboard live polling
- `dashboard/page.tsx`: `setInterval(() => loadDashboard(), 30_000)` — atualiza a cada 30s automaticamente

### 3. Upvote/downvote com login MASP
- `issues/page.tsx`: `handleVote` verifica `currentUser?.masp` antes de votar
- Se não logado ou sem MASP → modal com explicação + transparência de dados
- Modal lista: MASP nunca exibido publicamente, usuário pode apagar tudo, dados apenas para validação de identidade
- Botão leva para `/chat` onde o sidebar tem o login/cadastro

### 4. Registro com MASP + lotação
- `user-auth.ts`: `registerUser()` aceita `masp` + `lotacao` + `nome_partial`; valida formato MASP (5-9 dígitos); verifica unicidade do MASP
- `api/auth/register/route.ts`: expõe `masp` e `lotacao` no body
- `Sidebar.tsx`: form de cadastro com campos MASP + lotação + banner informativo sobre validação manual PC-MG
- Badge no sidebar: "MASP pendente" (amber) ou "MASP ✓" (green) para usuário logado

### 5. Pautas iniciais — seed
- `sql/seed_issues_v4.sql`: 10 pautas reais de policiais civis MG:
  1. Sem acesso a ocorrências de outros estados
  2. Helios versão light insuficiente
  3. Sem acesso direto ao Olho Vivo
  4. Bases da PF não integradas com PC-MG
  5. Baixo compartilhamento de dados entre forças
  6. Falta de efetivo no interior
  7. Infraestrutura de TI obsoleta
  8. Falta de viaturas e equipamentos
  9. Ausência de plano de carreira claro para Investigador
  10. Defasagem salarial vs. outras forças

### 6. Migration SQL v4
- `sql/migration_v4.sql`: campos `masp`, `lotacao`, `nome_partial`, `validation_status` em `user_accounts_852`
- View `pending_validations_852` para painel admin de validação
- `user_id` FK em `issue_votes_852` para deduplicação por usuário autenticado

### 7. Pre-commit SSOT em .egos
- `/home/enio/.egos/hooks/pre-commit` — hook universal com 6 checks:
  1. Secrets (grep patterns + gitleaks protect --staged)
  2. Arquivos grandes (>5MB bloqueio, >1MB aviso)
  3. TypeScript quality (console.log flood, .length unsafe)
  4. Python syntax (py_compile + ruff)
  5. TASKS.md sync reminder
  6. PII detection (CPF, MASP patterns)
- Instalado em `852/.git/hooks/pre-commit` via symlink
- **Para outros repos:** `ln -sf /home/enio/.egos/hooks/pre-commit <repo>/.git/hooks/pre-commit`

## Pendente (próxima sessão)

### Crítico — rodar manualmente no Supabase SQL editor
```
sql/migration_v4.sql  ← ADD masp/lotacao/validation_status columns
sql/seed_issues_v4.sql ← INSERT 10 police issues
```

### P1 (próximo sprint)
- Admin dashboard para validar registros MASP (view `pending_validations_852` já existe)
- Vote dedup por `user_id` em vez de `session_hash` (migração já preparada)
- Upload de PDF/documento nas pautas
- Pipeline real de notificações (Telegram/webhook)

### Task 6 ainda pendente
- Mapear e sincronizar configurações entre todos os repos EGOS (carteira-livre, egos-lab, br-acc, policia, forja)
- Instalar pre-commit hook universal nos demais repos

## Estado do VPS
- `https://852.egos.ia.br` → 200 ✓
- `https://852.egos.ia.br/chat` → 200 ✓
- `https://852.egos.ia.br/reports` → 200 ✓
- `https://852.egos.ia.br/issues` → 200 ✓
- Container: `852-app` rodando (docker compose up -d --force-recreate)

## Arquivos modificados nesta sessão
- `src/lib/report-store.ts` — +isOwn field, +loadAllPublicReports()
- `src/app/reports/page.tsx` — usa loadAllPublicReports, delete só para isOwn
- `src/app/dashboard/page.tsx` — 30s polling
- `src/app/issues/page.tsx` — vote login gate, login notice modal
- `src/components/chat/Sidebar.tsx` — MASP + lotação fields, validation badge
- `src/lib/user-auth.ts` — registerUser accepts masp/lotacao; getCurrentUser returns them
- `src/app/api/auth/register/route.ts` — exposes masp/lotacao
- `sql/migration_v4.sql` — NEW
- `sql/seed_issues_v4.sql` — NEW
- `/home/enio/.egos/hooks/pre-commit` — NEW (SSOT universal hook)
- `AGENTS.md` — 23 capabilities, P1/P2 roadmap
- `TASKS.md` — Sprint v4 completed

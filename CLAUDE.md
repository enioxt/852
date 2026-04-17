# EGOS-KERNEL-PROPAGATED: 2026-04-17
<!-- AUTO-INJECTED by disseminate-propagator.ts — DO NOT EDIT THIS BLOCK MANUALLY -->
<!-- Kernel commit: 33a5f0f | 1 rule section(s) changed -->
<!-- Kernel rules: ~/.claude/CLAUDE.md (always authoritative) -->
<!-- Re-run: bun ~/egos/scripts/disseminate-propagator.ts --all to update -->
<!-- + CLAUDE.md (2 lines) -->

> **EGOS Kernel rules apply to this repo.** See `~/.claude/CLAUDE.md` for full rules.
> Critical non-negotiables: no force-push main, no secret logging, no git add -A in agents.
> SSOT map: `~/.claude/egos-rules/ssot-map.md` | LLM routing: `~/.claude/egos-rules/llm-routing.md`

---

# CLAUDE.md — 852 Inteligência (Tira-Voz)

> Lido automaticamente pelo Claude Code CLI ao executar `claude` neste diretório.

## Projeto

**Tira-Voz (852)** — Chatbot institucional anônimo para policiais civis de Minas Gerais. Permite conversa com IA, detecção de PII, compartilhamento de relatos, fórum de pautas (Papo de Corredor), validação ética ATRiAN e identidade anônima gamificada. Deploy em produção: `https://852.egos.ia.br`.

## Arquitetura

```text
852/
├── src/app/             # Next.js 16 App Router
│   ├── (pages)/         # chat, issues, reports, conta, sugestao, legislacao
│   ├── api/             # Routes: chat, auth, correlate, hot-topics, admin
│   └── admin/           # Dashboard admin (telemetria, validações, convites)
├── src/lib/
│   ├── ai-provider.ts   # LLM router: Alibaba Qwen-plus + OpenRouter fallback
│   ├── atrian.ts        # Validação ética de output
│   ├── pii-scanner.ts   # CPF, RG, MASP, telefone, email, REDS, placas
│   ├── report-store.ts  # Persistência localStorage
│   └── correlate.ts     # Smart Correlation Engine
├── .egos/               # Symlink gov compartilhada EGOS
├── .guarani/            # Identidade e preferências locais
├── docker-compose.yml   # Contrato de runtime no VPS (SSOT)
├── AGENTS.md            # Mapa do sistema e capacidades
└── TASKS.md             # Prioridades e sprints (SSOT)
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| **Framework** | Next.js 16 + App Router |
| **Runtime** | Node 20 / npm |
| **LLM Primário** | Alibaba Qwen-plus (DashScope) |
| **LLM Fallback** | Gemini 2.0 Flash via OpenRouter |
| **Banco** | Supabase PostgreSQL (lhscgsqhiooyatkebose) |
| **Analytics** | Microsoft Clarity (vtsny72z0w) |
| **Deploy** | VPS Hetzner (204.168.217.125) (porta 3001, Caddy reverse proxy) |

## Comandos Principais

```bash
npm run dev              # Servidor local (porta 3000)
npm run build            # Build de produção
npm run lint             # ESLint
# No VPS Hetzner (204.168.217.125):
docker compose up -d     # Subir stack
docker compose logs -f   # Ver logs em tempo real
```

## Regras

- Leia `.guarani/PREFERENCES.md` para padrões de código locais
- Leia `.egos/guarani/PREFERENCES_SHARED.md` para padrões EGOS globais
- Commits convencionais: `feat:`, `fix:`, `chore:`, `docs:`
- SQL: sempre via `supabase db push`, nunca manual
- PII: todo output público passa pelo ATRiAN + PII scanner
- Nunca misturar este repo com `carteira-livre` ou `forja` (projetos separados)

## Deploy

```bash
# Produção no VPS Hetzner (204.168.217.125):
ssh root@hetzner
cd /opt/852
git pull && docker compose up -d --build
```

## Banco de Dados

Supabase (`lhscgsqhiooyatkebose`). RLS sempre ativado. Tabelas principais:
`telemetry_852`, `reports_852`, `conversations_852`, `issues_852`, `ai_reports_852`, `user_accounts_852`, `auth_codes_852`

## LGPD Compliance

**Status:** Baseline compliance active; healthcare extensions in progress

**Enforcement:**
- ✅ CPF/PII masking system-wide (lib/pii-scanner.ts)
- ✅ Audit logs (telemetry_events) recording all actions
- ✅ RLS (Row-Level Security) on all user-scoped data
- ⚠️ Healthcare data handling: See `../egos/frozen-zones/lgpd-health.md` if integrating with hospitals
- ⚠️ Pre-deploy LGPD checklist: Required for any health-related features

**Key Documents:**
- **Policy:** `../egos/frozen-zones/lgpd-health.md` (immutable frozen zone)
- **Checklist:** `../egos/frozen-zones/lgpd-health-checklist.md` (15-item compliance verification)
- **Incident Playbook:** `../egos/docs/INCIDENT_RESPONSE_HEALTH.md` (5+ breach scenarios)

**Healthcare Integration Rules** (if applicable):
1. Raw conversations deleted within 1 hour (0 retention)
2. Clinical extracts encrypted (AES-256) + RLS enforced
3. Telemetry pseudonymized (SHA256 + separate salt)
4. Consent log append-only + audit-protected
5. Incident response timeline: Hospital notified within 2h; ANPD within 3 days

**Pre-Deployment:**
- [ ] No raw phone numbers in logs (auto-check in CI)
- [ ] No test/real CPF in code (auto-check in CI)
- [ ] Retention windows defined (.env)
- [ ] Delete cron job confirmed (raw conversations)
- [ ] RLS policies enforced (DB)
- [ ] Encryption at rest enabled
- [ ] TLS 1.3+ enforced
- [ ] Incident playbook accessible
- [ ] DPA signed (if hospital integration)
- [ ] Hospital IT trained

See `.github/workflows/lgpd-compliance-check.yml` for CI/CD automation.

---

## Regra: Próxima Task

Quando iniciado neste repositório e perguntado "qual a próxima task?" ou "what's next?":
1. Leia este CLAUDE.md para contexto
2. Leia TASKS.md e identifique a task P0/P1 de maior prioridade incompleta
3. Leia PRs abertos: `gh pr list`
4. Responda com: task ID, descrição, arquivos envolvidos, e próximo passo concreto
Sem fricção. Direto ao ponto.

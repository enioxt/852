# EGOS-KERNEL-PROPAGATED: 2026-04-18
<!-- AUTO-INJECTED by disseminate-propagator.ts — DO NOT EDIT THIS BLOCK MANUALLY -->
<!-- Kernel commit: 630705c | 1 rule section(s) changed -->
<!-- Source of rules: egos/AGENTS.md (canonical). Kernel-only authoritative copy: ~/.claude/CLAUDE.md -->
<!-- Re-run: bun ~/egos/scripts/disseminate-propagator.ts --all to update -->
<!-- + .windsurfrules (1 lines) -->

> ⚠️ **PROPAGATED FROM KERNEL** — Edits to this block are overwritten by next `bun governance:sync:exec`.
> Edit kernel `egos/AGENTS.md` section between `<!-- PROPAGATE-RULES-BEGIN -->` and `<!-- PROPAGATE-RULES-END -->` instead.

<!-- === BEGIN KERNEL RULES BODY (auto-injected from egos/AGENTS.md) === -->

## 📋 Canonical Rules (authoritative across ALL IDEs)

This section is the single source of truth for agent rules. Claude Code reads this. Windsurf reads this. Cursor reads this. Codex reads this. GitHub Copilot reads this. When `~/.claude/CLAUDE.md`, `.windsurfrules`, or repo-level `CLAUDE.md` diverge from this file, **AGENTS.md wins**.

### R0 — Critical non-negotiables (irreversible damage prevention)
1. **NEVER `git push --force` to main/master/production** — use `bash scripts/safe-push.sh` (INC-001)
2. **NEVER log/echo/commit secrets** — no `.env`, no hardcoded keys
3. **NEVER publish externally without human approval** — articles, X posts, outreach
4. **NEVER `git add -A` in background agents** — always `git add <specific-file>` (INC-002)
5. **COMMIT TASKS.md immediately** after edit (parallel agents lose uncommitted state)

### R1 — Verification before assertion
1. **Code claims** (function exists, caller count, import usage, dead code, route mapping) → `codebase-memory-mcp` is PRIMARY. Read/Grep is fallback for docs/config/markdown only. If `cbm-code-discovery-gate` hook fires, load MCP tools via ToolSearch; never bypass.
2. **External LLM paste** (ChatGPT/Gemini/Grok/Kimi/Perplexity output) → every named feature, commit, file, version = UNVERIFIED CLAIM. Classify REAL/CONCEPT/PHANTOM via `git log --grep` + `Glob`. High-density buzzword lists (8+ capitalized "systems") = phantom signal (INC-005).
3. **Subagent audits** (Agent/Explore/Plan outputs) = SYNTHESIS, not evidence. Before citing in commit/SSOT edit: re-verify top 3 structural claims via `codebase-memory-mcp`. Absolute audit claims ("X doesn't exist", "Y is skeleton") without file:line anchor = PHANTOM until verified (INC-006).
4. **When spawning Agent/Explore/Plan** → prompt MUST include: "return evidence tuples `{claim, evidence_path, evidence_line}`; prefix unanchored with `UNVERIFIED:`".

### R2 — SSOT integrity
1. **Scored SSOT tables** (columns: `Compliance`/`Score`/`%`/`Coverage`/`Maturity`/`Readiness`/`Grade`) MUST be wrapped in `<!-- AUTO-GEN-BEGIN:<agent> -->` / `<!-- AUTO-GEN-END -->` populated by a compliance agent, OR every row MUST carry `VERIFIED_AT` + `method` + `evidence` (file:line or cmd output SHA). Handwritten scored tables are PHANTOM VECTORS. Pre-commit blocks after MSSOT-002 ships (INC-006).
2. **Use-case scoped scoring** — before applying a uniform rubric across products, declare each product's primary use case. Mark rubric rows REQUIRED/OPTIONAL/N/A per use case. `N/A (use case: X)` is valid, not a fail. Cannot use single score column across heterogeneous use cases (INC-006).
3. **ONE SSOT per domain** — see "SSOT Map" section below. New content goes to existing SSOT, never new file. Prohibited: `docs/business/`, `docs/sales/`, `docs/notes/`, `docs/tmp/`, timestamped docs, `AUDIT*.md`, `REPORT*.md`, `DIAGNOSTIC*.md` (except in `_archived/`).
4. **Evidence-first** — every claim in durable docs (README, SSOT, article) needs: automated test exercising it, metric confirming the number, entry in manifest (`.egos-manifest.yaml` or `CAPABILITY_REGISTRY.md`), or dashboard tile. Unproven claims marked `unverified:`.

### R3 — Edit safety
1. Read before Edit (at least the relevant section). Confirm exact string. Re-read after edit.
2. Max 3 edits per file before verification read.
3. Rename/signature change → grep all callers first.
4. Large files (>300 LOC): remove dead code first (separate commit), break into phases (max 5 files).
5. **Simplicity First (Karpathy):** minimum code that solves. No speculative abstractions. Wait for 3rd repetition before extracting. Test: "Would a senior engineer call this overcomplicated?"

### R4 — Git safety
1. Force-push forbidden on main/master/production/prod/release/hotfix. Exception: `EGOS_ALLOW_FORCE_PUSH=1` in shell only.
2. Always `bash scripts/safe-push.sh <branch>` (fetch+rebase+retry).
3. `.husky/pre-push` blocks non-FF. Answer = `git fetch && git rebase`, never `--no-verify`.

### R5 — Context & swarm
1. Use Agent tool when: 5+ files to read, >3 Glob/Grep rounds expected, research+implement needed. Don't spawn for single-file edits, git ops, known answers.
2. Independent tasks → all agents in ONE message. Dependent → sequential.
3. After 10+ turns or compaction: re-read TASKS.md + current file.
4. Cost control: 3 retries fail on same error → STOP, flag `[BLOCKER]`.
5. **Session checkpoint:** when pre-commit emits `[CHECKPOINT-NEEDED]` (turns≥10/commits≥15/elapsed≥90min), invoke `/checkpoint` (Hard Reset). Use `bun scripts/session-init.ts --status` to check. Never ignore [CHECKPOINT-NEEDED].

### R6 — Incident-driven (always load when relevant)
| Incident | Rule |
|---|---|
| INC-001 | Force-push protocol — `bash scripts/safe-push.sh` |
| INC-002 | Git swarm — `git add <specific>`, commit TASKS.md first |
| INC-003 | TASKS.md — verify artifact before adding, mark `[x]` same commit |
| INC-004 | Supabase Realtime quota — rate limiter + retention |
| INC-005 | External LLM narrative — classify REAL/CONCEPT/PHANTOM |
| INC-006 | Subagent phantoms + scored SSOT tables — see R1.3, R2.1-2 |

Full postmortems: `docs/INCIDENTS/INC-XXX-*.md`. Index: `docs/INCIDENTS/INDEX.md`.

<!-- === END KERNEL RULES BODY === -->

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

# EGOS Ecosystem Classification Registry

> **VERSION:** 2.0.0 | **UPDATED:** 2026-03-30 | **TASK:** EGOS-076
> **SSOT STATUS:** This file IS the canonical product/module classification map
> **Updated by:** EGOS Ecosystem Auditor (evidence-first, filesystem-verified)

---

## Classification Schema

| Class | Definition | Governance Rule |
|-------|-----------|----------------|
| `kernel` | Core governance/runtime in the `egos` repo | SSOT lives in `egos/.guarani/`; changes must pass frozen-zone check |
| `standalone` | Independent product with own ICP + GTM + revenue path | Must have own `TASKS.md` + ICP + pricing; no cross-product code coupling |
| `candidate` | Could become standalone; needs GTM validation first | Requires PRD gate (EGOS-077) before promotion; no external revenue claims |
| `lab` | Experiment or incubator surface; not production-ready | No external claims allowed; no prod data; can be promoted or archived |
| `internal_infra` | Tooling, CI, Hetzner, Docker, governance scripts | Powers other things; not sold directly |
| `archive` | Kept for reference; no active development | Read-only; no new commits except critical security fixes |
| `discard` | Should be deleted; blocking or redundant | A deletion task must exist in TASKS.md before removal |

---

## Governance Rules

- **kernel** surfaces → SSOT in `egos/.guarani/`; any change requires frozen-zone proof-of-work
- **standalone** → must maintain own `TASKS.md`, ICP document, and GTM artifact; no sharing production secrets with other products
- **candidate** → needs PRD gate (EGOS-077) to be promoted; making external revenue claims before promotion is a governance violation
- **lab** → no external claims (marketing, sales, partnerships) allowed; no production data; promoting to `candidate` requires evidence of reuse by 2+ repos or a paying customer signal
- **archive** → read-only commit policy; preserved for historical reference; never deleted
- **discard** → a TASKS.md deletion task must exist before any `rm` is run

---

## Surface Registry

### Kernel Surfaces (`egos` repo)

| Surface | Path | Classification | Status | Owner | Notes |
|---------|------|---------------|--------|-------|-------|
| Governance DNA | `egos/.guarani/` | `kernel` | Active | EGOS kernel | Identity, pipeline, domain rules, meta-prompts |
| Agent Runtime | `egos/agents/runtime/` | `kernel` | FROZEN | EGOS kernel | `runner.ts`, `event-bus.ts` — must not be edited |
| Agent Registry | `egos/agents/registry/` | `kernel` | Active | EGOS kernel | `agents.json` v2.0 (22-field schema), `schema.json` |
| Shared Utilities | `egos/packages/shared/src/` | `kernel` | Active | EGOS kernel | LLM provider, ATRiAN, PII scanner, rate limiter, telemetry, model-router |
| Search Engine | `egos/packages/search-engine/` | `kernel` | Active | EGOS kernel | Adaptive Atomic Retrieval (AAR) — in-memory full-text |
| Atomizer | `egos/packages/atomizer/` | `kernel` | Active | EGOS kernel | Semantic sentence-level atomization |
| Core Contracts | `egos/packages/core/` | `kernel` | Active | EGOS kernel | Search/module/integration contracts, PRI safety gate |
| Audit Package | `egos/packages/audit/` | `kernel` | Active | EGOS kernel | Versioned record change tracking |
| Registry Package | `egos/packages/registry/` | `kernel` | Active | EGOS kernel | Runtime module lookup |
| Types Package | `egos/packages/types/` | `kernel` | Active | EGOS kernel | Shared type definitions |
| Integration Adapters | `egos/integrations/` | `kernel` | Active | EGOS kernel | Slack, Discord, Telegram, WhatsApp, Webhook, GitHub contracts |
| MCP Governance Package | `egos/packages/mcp-governance/` | `kernel` | Active | EGOS kernel | MCP tooling for governance |
| Governance Scripts | `egos/scripts/` | `internal_infra` | Active | EGOS kernel | `governance-sync.sh`, `link-ssot-files.sh`, doctor, worktree-validator |
| Pre-commit Hooks | `egos/.husky/` | `internal_infra` | FROZEN | EGOS kernel | gitleaks + frozen-zone enforcement |
| GitHub Actions CI | `egos/.github/workflows/` | `internal_infra` | Active | EGOS kernel | lint + typecheck + registry lint |

### Guard Brasil Stack (`egos` repo)

| Surface | Path | Classification | Status | Owner | Notes |
|---------|------|---------------|--------|-------|-------|
| Guard Brasil Package | `egos/packages/guard-brasil/` | `standalone` | Active | EGOS kernel | `@egosbr/guard-brasil` v0.1.0 — 15/15 tests pass |
| Guard Brasil REST API | `egos/apps/api/` | `standalone` | LIVE | EGOS kernel | `guard.egos.ia.br` on Hetzner port 3099; MCP + REST |
| Guard Brasil Web | `egos/apps/guard-brasil-web/` | `standalone` | Active | EGOS kernel | Next.js dashboard — 3 versions (Giant/Lean/Radical) |

### egos-lab Apps (`egos-lab/apps/`)

| Surface | Path | Classification | Status | Owner | Notes |
|---------|------|---------------|--------|-------|-------|
| egos-web | `egos-lab/apps/egos-web/` | `standalone` | LIVE | egos-lab | `egos.ia.br` — acquisition/community platform |
| Eagle Eye | `egos-lab/apps/eagle-eye/` | `candidate` | Active | egos-lab | Procurement analysis tool; v3.0 stripped to core (EGOS-131) |
| Telegram Bot | `egos-lab/apps/telegram-bot/` | `candidate` | Active | egos-lab | OpenRouter-powered bot; needs ICP + GTM |
| Nexus | `egos-lab/apps/nexus/` | `candidate` | Active | egos-lab | Mobile app; needs consolidation with nexus-market (EGOS-073) |
| Intelink | `egos-lab/apps/intelink/` | `candidate` | Active | egos-lab | B2B AI integration layer; needs PRD gate |
| Agent Commander | `egos-lab/apps/agent-commander/` | `lab` | Active | egos-lab | Agent orchestration UI experiment |
| Carteira-X | `egos-lab/apps/carteira-x/` | `lab` | Active | egos-lab | Crypto wallet experiment; not production |
| Radio Philein | `egos-lab/apps/radio-philein/` | `lab` | Active | egos-lab | Radio/streaming experiment |
| Symphony EGOS | `egos-lab/apps/symphony-egos/` | `lab` | Active | egos-lab | Music/composition AI experiment |
| EGOS Self | `egos-lab/apps/egos-self/` | `lab` | Active | egos-lab | Self-reflection agent experiment |
| Marketplace Core | `egos-lab/apps/marketplace-core/` | `lab` | Active | egos-lab | Course marketplace experiment (Commons) |
| Nexus Market (archived) | `egos-lab/apps/_archived/nexus-market/` | `archive` | Archived | egos-lab | Superseded by Nexus consolidation |

### egos-lab Packages (`egos-lab/packages/`)

| Surface | Path | Classification | Status | Owner | Notes |
|---------|------|---------------|--------|-------|-------|
| Shared (egos-lab) | `egos-lab/packages/shared/` | `internal_infra` | Active | egos-lab | AI client, rate-limiter; used by telegram-bot and egos-lab apps |
| MCP Package (egos-lab) | `egos-lab/packages/mcp/` | `lab` | Active | egos-lab | MCP experiment; overlaps with kernel mcp-governance |
| Nexus Shared | `egos-lab/packages/nexus-shared/` | `candidate` | Active | egos-lab | Shared types for Nexus; consolidation pending |
| Data Workers | `egos-lab/packages/data-workers/` | `internal_infra` | Active | egos-lab | Background data processing workers |

### Leaf Repos (External Products)

| Surface | Repo | Classification | Status | Owner | Notes |
|---------|------|---------------|--------|-------|-------|
| 852 (Comunidade da Polícia) | `/home/enio/852/` | `standalone` | Production | enioxt | Law enforcement chatbot; 27 tools; live with gamification |
| EGOS Inteligência (br-acc) | `/home/enio/br-acc/` | `standalone` | Production | enioxt | OSINT/investigation platform; Python; 77M Neo4j graph |
| Forja | `/home/enio/forja/` | `candidate` | Active | enioxt | CRM/ERP chat backend; WhatsApp live; needs PRD for B2B SaaS |
| Carteira Livre | `/home/enio/carteira-livre/` | `candidate` | Active | enioxt | Portability engine + AI flows; needs monetization PRD |
| Santiago | `/home/enio/santiago/` | `candidate` | Active | enioxt | Next.js app; needs ICP and GTM validation |
| INPI | `/home/enio/INPI/` | `candidate` | Active | enioxt | IP/patent platform; Next.js; needs PRD gate |
| Policia | `/home/enio/policia/` | `lab` | Active | enioxt | Police operations tool; Python; OVM core; no GTM yet |
| Commons | `/home/enio/commons/` | `candidate` | Active | enioxt | Course marketplace; 2 courses live; needs LMS vs hosted decision |
| Agent-028 Dashboard | `egos/apps/agent-028-template/` | `candidate` | Active | EGOS kernel | UI + data pipeline done; Vercel deploy needed; needs ICP |

### Infrastructure

| Surface | Location | Classification | Status | Owner | Notes |
|---------|----------|---------------|--------|-------|-------|
| Hetzner VPS | `204.168.217.125` | `internal_infra` | Active | enioxt | Primary runtime host; Docker; Caddy TLS |
| Evolution API | Hetzner port 8080 | `internal_infra` | Active | enioxt | WhatsApp runtime; `forja-notifications` instance live |
| Docker Services | Hetzner | `internal_infra` | Active | enioxt | 8 services: guard-brasil-api, evolution-api, etc. |
| Caddy Reverse Proxy | Hetzner | `internal_infra` | Active | enioxt | TLS termination for `*.egos.ia.br` domains |
| Supabase | Cloud | `internal_infra` | Active | enioxt | Shared DB/auth across products |
| CRCDM Pre-commit Hook | `~/.egos/hooks/pre-commit` | `internal_infra` | Active | EGOS kernel | Canonical security hook symlinked to all repos |
| Governance Sync | `egos/scripts/governance-sync.sh` | `internal_infra` | Active | EGOS kernel | Kernel → `~/.egos` → leaf propagation |

### Archive

| Surface | Classification | Reason | Last Active |
|---------|---------------|--------|------------|
| Old egos-lab system map (pre-2026-03) | `archive` | Superseded by kernel SYSTEM_MAP | 2026-02 |
| Early chatbot experiments | `archive` | Superseded by 852 + forja | 2025-Q4 |
| egos-lab capability docs (duplicates) | `archive` | Kernel owns CAPABILITY_REGISTRY | 2026-03 |
| nexus-market (`_archived/`) | `archive` | Superseded by nexus consolidation | 2026-03 |

---

## Promotion Gates

| Transition | Required Evidence |
|------------|------------------|
| `lab` → `candidate` | Reuse by 2+ repos OR paying customer signal |
| `candidate` → `standalone` | PRD (EGOS-077 gate) + ICP document + pricing model + success metric |
| `standalone` → revenue | First paying customer (any tier) |
| Any → `archive` | Decision documented in TASKS.md session summary |
| Any → `discard` | Deletion task in TASKS.md + review by kernel owner |

---

## Wiring Status

| Surface | TASKS.md | SYSTEM_MAP.md | CAPABILITY_REGISTRY.md |
|---------|----------|---------------|----------------------|
| Guard Brasil Package | ✅ EGOS-062..064 | ✅ v2.3.0 | ✅ v1.6.0 |
| Guard Brasil API | ✅ EGOS-124 | ✅ v2.3.0 | ✅ v1.6.0 |
| Ecosystem Classification Registry | ✅ EGOS-076 | ✅ v2.4.0 (pointer added) | — |
| Eagle Eye | ✅ EGOS-131 | — | — |
| EGOS Inteligência (br-acc) | ✅ EGOS-127/128 | — | ✅ v1.6.0 |
| PRI Safety Gate | ✅ EGOS-070 | ✅ v2.3.0 | ✅ v1.6.0 |

---

## Update Protocol

1. Any new product/module proposal → add as `candidate` here first
2. `candidate` → `standalone` requires: PRD, ICP, pricing, success metric, multi-model review (EGOS-077)
3. `lab` → `candidate` requires: evidence of reuse by 2+ repos or paying customer signal
4. `standalone` → first paying customer unlocks full GTM spend
5. `archive` items are never deleted — preserved for reference
6. `discard` requires a TASKS.md deletion task before any file removal

---

*Maintained by: EGOS Kernel*
*Wired into: TASKS.md, SYSTEM_MAP.md (v2.4.0), CAPABILITY_REGISTRY.md*
*Related tasks: EGOS-075, EGOS-076, EGOS-077*
*Last filesystem evidence scan: 2026-03-30*

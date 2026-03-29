# SYSTEM_MAP — 852 Inteligência

> **Version:** 1.0.0 | **Updated:** 2026-03-20
> **Purpose:** local activation map for `/start` and day-to-day work in this repo

---

## 1. Local SSOT

- `AGENTS.md` — workspace map, capabilities, deploy surface
- `TASKS.md` — backlog and sprint truth
- `.windsurfrules` — active runtime rules
- `docs/SYSTEM_MAP.md` — this local architecture map

## 2. Governance Chain

- Shared governance root: `/home/enio/.egos`
- Local symlink: `.egos -> /home/enio/.egos`
- Local overrides: `.guarani/*`, `.windsurfrules`, `AGENTS.md`, `TASKS.md`
- Repo role: `egos.config.json` (`leaf`)

## 3. Activation Surfaces

- `.windsurf/workflows/*` — Windsurf slash workflows
- `.agent/workflows/*` — Antigravity/Cline slash workflows
- `.windsurf/skills/*` and `.agent/skills/*` — shared skills
- `.git/hooks/pre-commit → ~/.egos/hooks/pre-commit` — **hook canônico único** (symlink); checks: gitleaks, regex secrets, doc-proliferation, SSOT limits, handoff freshness, CRCDM DAG
- `.git/hooks/post-commit`, `.git/hooks/pre-push` — CRCDM hooks (observability + cross-repo impact)
- `.husky/pre-commit` — stub de redirecionamento (não ativo); decisão GOV-201 2026-03-29: hook único = CRCDM universal

## 4. Module Roots

- `src/app/` — routes, pages, and API handlers
- `src/components/` — shared UI and feature components
- `src/lib/` — auth, AI routing, telemetry, storage, prompt logic
- `sql/` — legacy/manual SQL references
- `supabase/migrations/` — tracked schema migration truth
- `scripts/` — smoke, release, verification, and support automation
- `public/brand/` — visual brand assets

## 5. Runtime + Deploy Surface

- Local dev: `npm run dev`
- Quality: `npm run lint`
- Local smoke: `npm run smoke:local`
- Governance: `npm run governance:check`, `npm run governance:sync`
- Production release: `npm run release:prod`
- Runtime contract: `docker-compose.yml`
- Public URL: `https://852.egos.ia.br`
- VPS target: Hetzner `204.168.217.125`

## 6. Core Product Flows

- `/chat` — anonymous AI intake + report review
- `/sugestao` — direct structured suggestion flow
- `/papo-de-corredor` — unified community hub
- `/reports` — shared reports and AI report generation
- `/conta` — account, auth, and admin bridge
- `/admin/telemetry` — ATRiAN and operational metrics

## 7. Fallback Rule

If a required local surface is missing during `/start`, use the canonical fallback from `.egos` or `/home/enio/egos` and record the drift explicitly instead of claiming full activation.
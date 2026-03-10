# Chatbot Production Reverse Engineering — 852

## Purpose

This document converts the full production-hardening conversation into a reusable operating model for the 852 project and future EGOS chatbot launches.

## Conversation Metrics

Derived from the exported chat log (`Finalize Chatbot Production Hardening.md`):

- **7** user-input phases
- **314** accepted shell commands
- **100** file edit events
- **34** MCP tool events
- **39** todo updates

Most frequent command families:

- **`bun`** — 51
- **`ssh`** — 44
- **`git`** — 26
- **`cat`** — 25
- **`sed`** — 24
- **`curl`** — 22
- **`npm`** — 18
- **`rsync`** — 9

## Reverse-Engineered Delivery Phases

### 1. Discovery and framing

- User intent was broad and high-entropy.
- The work mixed product design, governance sync, chatbot implementation, Docker deploy, Caddy, assets, and public release.
- The best moments came when the work was split into clear fronts instead of blended execution.

### 2. Bootstrap and foundation

- The repo started with bootstrap friction.
- Initial dependency flow mixed **Bun** and **npm**, which later forced `package-lock.json` generation for Docker.
- Some commands were corrective instead of planned.

### 3. Product/UI implementation

- The chat app evolved into a strong baseline:
  - collapsible sidebar
  - local conversation persistence
  - FAQ
  - export actions
  - WhatsApp sharing
  - markdown rendering
  - mobile drawer behavior

### 4. Production deploy

- Docker + Caddy + Contabo deploy worked.
- The domain required DNS propagation and explicit smoke verification.
- Repeated rsync/build/up/smoke cycles created operational overhead.

### 5. Governance normalization

- The project was outside the EGOS governance mesh.
- The canonical correction path was `egos-gov sync`, not manual copying.
- `AGENTS.md` was the last missing governance artifact.

### 6. Asset ingestion and branding

- Stitch assets were usable, but naïve ZIP extraction failed due to long filenames.
- The reliable pattern was **targeted extraction with deterministic short names**.

### 7. Production hardening

- Public anonymous chat required compensating controls:
  - payload validation
  - provider availability checks
  - rate limiting
  - smoke tests for `200`, `400`, and `429`

### 8. Release stabilization

- The biggest incident came from deploy contract drift:
  - `docker-compose.yml` existed only on the VPS
  - `rsync --delete` removed it
- The permanent fix was to version `docker-compose.yml` in the repo.
- A second critical incident came from network topology drift:
  - Caddy routed to `852-app:3000`
  - app container was not on the shared proxy network
- The permanent fix was to attach the app to `infra_bracc` with a stable alias.

## What Worked Well

- Using the **canonical EGOS sync** instead of hand-curating governance
- Verifying production with real `curl` smoke tests
- Treating `AGENTS.md`, `TASKS.md`, and `.windsurfrules` as living operational contracts
- Turning bugs into deploy rules immediately after root-cause diagnosis
- Reusing existing repo modules instead of rebuilding from scratch:
  - `chat-store.ts`
  - `MarkdownMessage.tsx`
  - `Sidebar.tsx`
  - `prompt.ts`
  - `Dockerfile`
  - `egos-gov`

## Main Gaps Found

### Gap 1 — No one-command release

Symptoms:

- repeated `lint/build/rsync/ssh/docker/curl`
- manual command composition
- more surface for mistakes

Fix now implemented:

- `npm run release:prod`

### Gap 2 — No reusable Stitch import path

Symptoms:

- long-filename ZIP failure
- manual extraction logic repeated ad hoc

Fix now implemented:

- `npm run brand:import -- /absolute/path/to/stitch.zip`

### Gap 3 — Deploy contract was implicit

Symptoms:

- unmanaged VPS-only `docker-compose.yml`
- accidental deletion during rsync

Fix now implemented:

- repo-versioned `docker-compose.yml`

### Gap 4 — Reverse proxy network contract was implicit

Symptoms:

- `502` on public domain even when app was healthy on localhost

Fix now implemented:

- external `infra_bracc` network in compose
- stable alias `852-app`

### Gap 5 — Public anonymous API was not codified as a security exception

Symptoms:

- public route without a formal local rule explaining compensating controls

Fix now implemented:

- explicit rule in `.guarani/PREFERENCES.md`
- rate limit + validation in `/api/chat`

## Existing EGOS Assets That Should Always Be Reused

- **`egos-gov sync`** — canonical governance propagation
- **`.windsurf/workflows/start.md`** — session initialization
- **`.windsurf/workflows/regras.md`** — rule-loading pass
- **`.windsurf/workflows/disseminate.md`** — knowledge persistence
- **`.husky/pre-commit`** — local governance gate
- **`AGENTS.md`** — deploy surface and workspace map
- **`TASKS.md`** — SSOT for execution status

## New Standard Commands

- **Governance check**
  - `npm run governance:check`
- **Governance sync**
  - `npm run governance:sync`
- **Import Stitch assets**
  - `npm run brand:import -- /path/to/stitch.zip`
- **Local smoke**
  - `npm run smoke:local`
- **Public smoke**
  - `npm run smoke:public`
- **Full release**
  - `npm run release:prod`

## Recommended Default Operating Sequence

1. Run `/start`
2. Run `/regras`
3. Run `npm run governance:check`
4. If assets changed, run `npm run brand:import -- /path/to/stitch.zip`
5. Implement only after reading authoritative repo surfaces
6. Run `npm run lint`
7. Run `npm run build`
8. Run `npm run smoke:local`
9. Run `npm run release:prod`
10. Run `/disseminate`
11. Run `/end`

## Preventive Heuristics From This Conversation

- Never rely on a VPS-only compose file.
- Never use rsync delete semantics against a deploy target unless the repo fully contains the deploy contract.
- Every public anonymous endpoint must define compensating controls.
- If Caddy proxies by container name, the app must share the proxy network.
- If a ZIP source is AI-generated, expect unstable filenames and normalize them on import.
- Prefer repo-native automation over repeated terminal choreography.

## Success Criteria for Future Runs

A future run is better than this one if it reaches the same end state with:

- fewer ad hoc shell commands
- no dependency-manager drift
- no deploy-contract drift
- no manual asset-copy steps
- no public-domain proxy surprises
- no undocumented security exceptions

# AGENTS.md — 852 Inteligência

> **VERSION:** 1.0.0 | **UPDATED:** 2026-03-10
> **TYPE:** Next.js production chatbot + EGOS-governed public repo

---

<!-- llmrefs:start -->

## LLM Reference Signature

- **Role:** workspace map + deploy surface + governance entrypoint
- **Summary:** Public anonymous institutional intelligence chatbot for Civil Police officers in Minas Gerais, deployed on Contabo VPS and governed by the EGOS mesh.
- **Read next:**
  - `.windsurfrules` — active repo governance and local mandates
  - `TASKS.md` — current priorities and blockers
  - `.egos/guarani/PREFERENCES_SHARED.md` — shared EGOS standards
  - `.guarani/PREFERENCES.md` — repo-specific overrides

<!-- llmrefs:end -->

## Project Overview

| Item | Value |
|------|-------|
| **Project** | 852 Inteligência |
| **Path** | `/home/enio/852` |
| **Public URL** | `https://852.egos.ia.br` |
| **Public Repo** | `github.com/enioxt/852` |
| **Framework** | Next.js 16 + App Router |
| **Runtime** | Node 20 / npm |
| **Primary LLM** | Alibaba Qwen-plus via DashScope |
| **Fallback LLM** | Gemini 2.0 Flash via OpenRouter (paid) |
| **Persistence (current)** | `localStorage` no navegador |
| **Future persistence** | Supabase + RLS |
| **Governance SSOT** | `/home/enio/.egos` via `.egos` symlink |

## Architecture

```text
852/
├── .egos/                        # Shared EGOS governance symlink (local only)
├── .guarani/
│   ├── IDENTITY.md               # Agent 852 identity
│   ├── PREFERENCES.md            # Local repo overrides
│   └── ...                       # Shared symlinked governance via egos-gov
├── .windsurf/
│   ├── workflows/                # Synced Windsurf workflows (local symlinks)
│   └── skills/                   # Synced skills (local symlinks)
├── public/brand/                 # Logo, avatar, OG image, background pattern
├── src/app/
│   ├── api/chat/route.ts         # Main streaming chat endpoint
│   ├── api/chat/info/route.ts    # Model/provider metadata
│   ├── chat/page.tsx             # Main chat UI
│   ├── layout.tsx                # Metadata, icons, OG, fonts
│   └── page.tsx                  # Landing page
├── src/components/chat/
│   ├── Sidebar.tsx               # Conversation history + nav
│   ├── FAQModal.tsx              # FAQ modal
│   └── MarkdownMessage.tsx       # GFM markdown rendering
├── src/lib/
│   ├── chat-store.ts             # localStorage conversation persistence
│   └── prompt.ts                 # Agent 852 system prompt
├── TASKS.md                      # SSOT for repo tasks
└── .windsurfrules                # Active Windsurf repo rules
```

## Deploy Surface

| Layer | Value |
|------|-------|
| **VPS** | Contabo |
| **IP** | `217.216.95.126` |
| **Reverse Proxy** | Caddy |
| **App Path (VPS)** | `/opt/852` |
| **Container Port** | `3000` |
| **Host Port** | `3001` |
| **Caddy Path** | `/opt/bracc/infra/Caddyfile` |
| **Compose File** | `/opt/852/docker-compose.yml` |

## Frozen / Sensitive Zones

Do not modify without explicit need:

- `.env*` files
- `.egos/` shared governance source
- symlinked shared governance surfaces created by `egos-gov`
- `.husky/` beyond governance-related adjustments
- VPS infra files outside the 852 app scope

## Commands

```bash
# Local
npm run dev
npm run build
npm run lint

# Governance
export PATH="$HOME/.egos/bin:$PATH"
egos-gov check
egos-gov sync

# Public smoke tests
curl -I https://852.egos.ia.br
curl -s -N -X POST https://852.egos.ia.br/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"oi"}]}'

# VPS deploy
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.env' --exclude='.git' ./ contabo:/opt/852/
ssh contabo "cd /opt/852 && docker compose build --no-cache && docker compose up -d --force-recreate"
```

## Governance Notes

- Shared EGOS content is consumed from `/home/enio/.egos`.
- Repo-specific truth stays in `TASKS.md`, `.windsurfrules`, `.guarani/IDENTITY.md`, and `.guarani/PREFERENCES.md`.
- Do **not** publish machine-specific absolute symlinks from `.agent/`, `.windsurf/`, or shared `.guarani/*` paths into the public repo.
- When governance drifts, fix it through `egos-gov sync`, not by hand-copying shared files.

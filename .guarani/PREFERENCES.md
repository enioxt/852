# GUARANI PREFERENCES — 852 Inteligência

> **Version:** 2.0.0

## Security (Non-Negotiable)

1. **Secrets:** NO hardcoded keys. Use `.env`.
2. **PII Masking:** Strict masking of CPF, process numbers, specific names, and sensitive situations in conversations.
3. **RLS ALWAYS ON:** Every new table MUST have `ENABLE ROW LEVEL SECURITY`.
4. **Anonymous Chat Exception:** `/api/chat` and `/api/chat/info` are intentionally public routes for anonymous institutional intake. Compensating controls are mandatory: request validation, rate limiting, no PII retention, and no server-side conversation storage by default.
5. **Public Anonymous Endpoints:** Any future public anonymous route MUST ship with success-path smoke coverage, invalid-payload rejection, and explicit provider/error handling before deploy.

## Code Quality

1. **TypeScript:** Strict mode. Avoid `any`.
2. **Comments:** Explain "WHY", not "WHAT".
3. **Supabase Client:** NEVER create Supabase clients at module top-level. ALWAYS use lazy initialization.
4. **Automation First:** Prefer repo-native scripts and package commands over long ad hoc terminal sequences for recurring tasks.

## Deploy Contract

1. **Compose SSOT:** `docker-compose.yml` in the repo root is the source of truth for Contabo runtime.
2. **Safe Sync:** Rsync deploys MUST exclude local governance symlinks and derived EGOS folders (`.egos`, `.agent`, `.windsurf`, `.guarani/orchestration`, `.guarani/philosophy`, `.guarani/prompts`, `.guarani/refinery`).
3. **Proxy Network:** If Caddy proxies by container name, the application service MUST share the reverse-proxy Docker network with a stable alias.

## UI/UX Standards

- **Mobile First:** The application must be fully responsive and optimized for mobile devices (WhatsApp sharing context).
- **Tailwind:** Use utility classes.
- **Icons:** Use `lucide-react`.
- **Theme:** Police Intelligence identity (Dark Mode Only, slate-900/950 backgrounds).

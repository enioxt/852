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
5. **Supabase CLI Only:** Schema changes and SQL migrations are applied ONLY via Supabase CLI. NEVER use dashboard SQL editor, ad hoc raw queries, or manual remote execution for tracked schema changes.
6. **Canonical Flow:** For schema work, follow this order: `supabase login` → `supabase link --project-ref <ref>` → place files in `supabase/migrations/` with timestamp prefix → `npx supabase db push`.
7. **History Drift Protocol:** If remote migration history is out of sync, first inspect the mismatch, then repair tracking with `supabase migration repair --status reverted <versions>` and only then run `npx supabase db push --include-all` when needed to force local tracked migrations.
8. **No Manual Hotfixes:** If an urgent production fix starts as raw SQL for investigation, it MUST be converted into a proper migration file before the task is considered done. Repo state and remote state must end aligned.
9. **Verification After Push:** After every migration push, verify the expected columns/tables/indexes from the application surface that depends on them and record the result in project docs or TASKS when the migration was part of planned work.
10. **Bounded Research:** External searches and potentially slow MCP calls MUST start with narrow scope, low result counts, and a clear fallback path. If a tool stalls or yields low-value results, stop early, inform the user, and switch to a smaller query or local evidence.

## Deploy Contract

1. **Compose SSOT:** `docker-compose.yml` in the repo root is the source of truth for Contabo runtime.
2. **Safe Sync:** Rsync deploys MUST exclude local governance symlinks and derived EGOS folders (`.egos`, `.agent`, `.windsurf`, `.guarani/orchestration`, `.guarani/philosophy`, `.guarani/prompts`, `.guarani/refinery`).
3. **Proxy Network:** If Caddy proxies by container name, the application service MUST share the reverse-proxy Docker network with a stable alias.

## UI/UX Standards

- **Mobile First:** The application must be fully responsive and optimized for mobile devices (WhatsApp sharing context).
- **Tailwind:** Use utility classes.
- **Icons:** Use `lucide-react`.
- **Theme:** Police Intelligence identity (Dark Mode Only, slate-900/950 backgrounds).

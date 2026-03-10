# GUARANI PREFERENCES — 852 Inteligência

> **Version:** 2.0.0

## Security (Non-Negotiable)

1. **Secrets:** NO hardcoded keys. Use `.env`.
2. **PII Masking:** Strict masking of CPF, process numbers, specific names, and sensitive situations in conversations.
3. **RLS ALWAYS ON:** Every new table MUST have `ENABLE ROW LEVEL SECURITY`.
4. **Anonymous Chat Exception:** `/api/chat` and `/api/chat/info` are intentionally public routes for anonymous institutional intake. Compensating controls are mandatory: request validation, rate limiting, no PII retention, and no server-side conversation storage by default.

## Code Quality

1. **TypeScript:** Strict mode. Avoid `any`.
2. **Comments:** Explain "WHY", not "WHAT".
3. **Supabase Client:** NEVER create Supabase clients at module top-level. ALWAYS use lazy initialization.

## UI/UX Standards

- **Mobile First:** The application must be fully responsive and optimized for mobile devices (WhatsApp sharing context).
- **Tailwind:** Use utility classes.
- **Icons:** Use `lucide-react`.
- **Theme:** Police Intelligence identity (Dark Mode Only, slate-900/950 backgrounds).

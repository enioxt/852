# TASKS — 852 Inteligência

## 🚨 P0 - Go Live

- [x] Fix: chatbot responde e faz streaming token-by-token
- [x] Alibaba DashScope como modelo primário
- [x] OpenRouter Gemini 2.0 como fallback pago
- [x] Auditoria de segredos e vazamentos
- [x] Repositório público sanitizado `enioxt/852`
- [x] Deploy v1 no VPS Contabo via Docker (porta 3001, Caddy reverse proxy)
- [x] UI/UX overhaul: sidebar colapsável, histórico, persistência localStorage, FAQ, quick actions
- [x] Landing page redesenhada (tema escuro neutro)
- [x] **DNS:** `852.egos.ia.br` online com HTTPS via Caddy
- [x] Assets visuais integrados: logo, avatar IA, background pattern, OG image
- [x] Governança EGOS sincronizada via `egos-gov sync` (`.egos`, workflows, skills, AGENTS.md)

## 🏃 P1 - Polimento

- [x] Chat UI mobile-first com tipografia Geist
- [x] Prompt institucional com anonimização
- [x] Exportação PDF/DOCX/Markdown (dropdown)
- [x] Compartilhamento WhatsApp dinâmico
- [x] README/.env.example/License para repo público
- [x] Markdown rendering nas respostas da IA (bold, listas, código)
- [x] Mobile responsive sidebar (drawer no mobile)
- [x] Favicon e meta tags OG
- [x] Hardening inicial da API: rate limit + validação de payload + headers de quota
- [x] Fix: stream protocol mismatch (toTextStreamResponse + streamProtocol:'text')
- [x] DRY refactor: ai-provider.ts shared module (eliminates 3x duplication)
- [x] Telemetria: Clarity + Supabase + structured JSON logs + admin dashboard (/admin/telemetry)
- [x] Configurar Microsoft Clarity: projeto vtsny72z0w ativado, NEXT_PUBLIC_CLARITY_ID no .env local e VPS
- [x] Camada de Verdade ATRiAN: reescrita completa do system prompt (remover Sindpol, epistemic humility, sem siglas inventadas)
- [x] Módulo ATRiAN (`src/lib/atrian.ts`): validação ética de output com telemetria integrada
- [x] Report Sharing System: PII scanner + AI review + report store + ReportReview modal
- [x] PII Scanner (`src/lib/pii-scanner.ts`): CPF, RG, MASP, phone, email, REDS, plates, names
- [x] AI Review API (`/api/review`): conversation completeness analysis, topic suggestions, blind spots
- [x] Report Store (`src/lib/report-store.ts`): localStorage persistence, share/delete controls
- [x] /reports page refactored: shared reports tab + AI report generator tab
- [x] Landing page: 4-feature grid + reports CTA link
- [x] Navigation: Home icon no header do /chat + links Home/Relatórios no sidebar
- [x] Fix: análise IA injetada no chat ao clicar sugestão (nada se perde)
- [x] Telemetry events: report_shared, report_deleted, report_review
- [x] AGENTS.md v2.0: system map completo, capabilities, roadmap, user flow
- [x] README.md v2.0: features, stack, system map, deploy, roadmap

## ✅ P1 - Sprint (Completed 2026-03-11)

- [x] Fix JSON parse error in AI review (robust parsing + generateText)
- [x] Fix auto-review: only auto-trigger once, require explicit re-analyze button
- [x] Supabase ativado: 5 tabelas criadas (telemetry_852, reports_852, conversations_852, admin_users_852, admin_sessions_852)
- [x] Admin auth system: email/password login, sessions in Supabase, PBKDF2 hashing
- [x] Admin login page (`/admin/login`) + logout + auth middleware
- [x] Telemetry API protegida com admin auth
- [x] Supabase persistence: conversations sync from chat page (background)
- [x] API routes: `/api/conversations`, `/api/reports/server`, `/api/dashboard`
- [x] Dashboard API with real aggregated metrics from Supabase
- [x] Admin user criado em produção (enioxt@gmail.com)
- [x] Deploy v2 no VPS Contabo com todas as features acima

## ✅ P1 - Sprint v3 (Completed 2026-03-12)

- [x] Supabase v2: 6 novas tabelas (issues_852, ai_reports_852, user_accounts_852, user_sessions_852, issue_votes_852, issue_comments_852)
- [x] Public Stats API (`/api/stats`) com dados reais agregados
- [x] Auto-report generation: qwen-max gera relatório a cada 5 conversas (`/api/ai-reports/generate`)
- [x] Issues system: GitHub-like anonymous topics com voting e comments (`/issues` + `/api/issues`)
- [x] Landing page overhaul: live stats, animated counters, AI report showcase, progress bar, pending topics
- [x] Auto-report trigger wired into conversation save flow (fire-and-forget)
- [x] qwen-max pricing added to ai-provider.ts
- [x] Optional user auth: email/password login for cross-device chat persistence
- [x] User auth API routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`
- [x] User auth UI: login/register modal in sidebar + user status display + logout
- [x] Issues link added to sidebar navigation
- [x] Telemetry events: ai_report_generated, issue_created, user_registered, user_login

## ⏭️ Backlog

- [ ] Dashboard UI com métricas reais Recharts (substituir mock data no /dashboard)
- [ ] Migrar report-store de localStorage para Supabase (dual write: local + server)
- [ ] Session hashing: cada interação gera um hash único rastreável
- [ ] Memória persistente do agente entre sessões (conversation summaries → system prompt)
- [ ] Cross-conversation insight aggregation (temas, padrões, regiões)
- [ ] ETHIK/Gamificação com dados reais
- [ ] Refinar OG image para proporção 1200x630 real
- [ ] Decompose `chat/page.tsx` (~450 lines) — extract WelcomeScreen, MessageList, InputArea, ExportMenu
- [ ] CI/CD pipeline (lint + build + smoke on push/PR)
- [ ] Consolidar package manager (remover vestígios de bun, manter npm)
- [ ] ATRiAN v2: NeMo Guardrails ou Guardrails AI para validação em tempo real (pós-streaming)
- [ ] ATRiAN dashboard: visualizar violations no /admin/telemetry
- [ ] Expandir KNOWN_ACRONYMS no atrian.ts com siglas específicas de cada delegacia/setor
- [ ] Admin view para relatórios compartilhados (autenticado)
- [ ] Tool use: web search para dados institucionais (AI SDK tools)
- [ ] Voice input (speech-to-text via Browser API)
- [ ] Proactive collaboration suggestions (agent sugere temas durante a conversa)
- [ ] User-linked conversation persistence (load from Supabase when logged in)

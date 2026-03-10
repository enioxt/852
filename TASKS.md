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

## ⏭️ Backlog

- [ ] Ativar Supabase para 852: criar tabela telemetry_852 (migration pronta), adicionar env vars
- [ ] Supabase real + RLS para persistência server-side de conversas e relatórios
- [ ] Migrar report-store de localStorage para Supabase (reports_852 table)
- [ ] Memória persistente + tools
- [ ] Dashboard com métricas reais (substituir mock data)
- [ ] ETHIK/Gamificação com dados reais
- [ ] Relatórios HTML avançados
- [ ] Refinar OG image para proporção 1200x630 real
- [ ] Decompose `chat/page.tsx` (~420 lines) — extract WelcomeScreen, MessageList, InputArea, ExportMenu
- [ ] CI/CD pipeline (lint + build + smoke on push/PR)
- [ ] Consolidar package manager (remover vestígios de bun, manter npm)
- [ ] ATRiAN v2: NeMo Guardrails ou Guardrails AI para validação em tempo real (pós-streaming)
- [ ] ATRiAN dashboard: visualizar violations no /admin/telemetry
- [ ] Expandir KNOWN_ACRONYMS no atrian.ts com siglas específicas de cada delegacia/setor
- [ ] Admin view para relatórios compartilhados (autenticado)

# TASKS — Tira-Voz (852)

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

- [x] 852-SSOT-001: Adotar o `egos/docs/SSOT_REGISTRY.md` no `852` — apontar `AGENTS.md`, `TASKS.md` e mapas/docs institucionais para o contrato canônico e separar claramente SSOT global vs superfícies locais do produto
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
- [x] Admin user criado em produção (`enioxt@gmail.com`)
- [x] Deploy v2 no VPS Contabo com todas as features acima

## ✅ P1 - Sprint v3 (Completed 2026-03-12)

- [x] Supabase v2: 6 novas tabelas (issues_852, ai_reports_852, user_accounts_852, user_sessions_852, issue_votes_852, issue_comments_852)
- [x] Public Stats API (`/api/stats`) com dados reais agregados
- [x] Auto-report generation: qwen-max gera relatório de inteligência a cada 5 relatos compartilhados (`/api/ai-reports/generate`)
- [x] Issues system: GitHub-like anonymous topics com voting e comments (`/issues` + `/api/issues`)
- [x] Landing page overhaul: live stats, animated counters, AI report showcase, progress bar, pending topics
- [x] Auto-report trigger wired into report share flow (fire-and-forget)
- [x] qwen-max pricing added to ai-provider.ts
- [x] Optional user auth: email/password login for cross-device chat persistence
- [x] User auth API routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`
- [x] User auth UI: login/register modal in sidebar + user status display + logout
- [x] Issues link added to sidebar navigation
- [x] Telemetry events: ai_report_generated, issue_created, user_registered, user_login

## ✅ P1 - Sprint v5.1 (Completed 2026-03-11)

- [x] Landing stats semantics corrigidas: relatórios revisados pela IA separados de relatórios de inteligência agregados
- [x] Progress bar da landing corrigida para contar relatos compartilhados desde o último relatório de inteligência
- [x] Backfill inicial de tópico automático a partir de relato compartilhado já salvo
- [x] Repo `852` adicionado ao mesh compartilhado do `~/.egos/sync.sh` com workflows e skills sincronizados

## ✅ P1 - Sprint v4 (Completed 2026-03-13)

- [x] Cross-device report sync: `loadAllPublicReports()` fetches all public reports (not filtered by session) — visível em qualquer dispositivo
- [x] Delete button visível apenas para `isOwn` reports (relatório pertence à sessão atual)
- [x] Dashboard live polling: atualização automática a cada 30s conforme conversas acontecem
- [x] Upvote/downvote agora requer conta autenticada com identidade protegida; MASP segue em trilha separada de validação institucional
- [x] Registro de MASP + lotação no cadastro (user_accounts_852) com validação manual
- [x] SQL migration_v4.sql: campos masp/lotacao/validation_status/nome_partial na tabela de usuários
- [x] SQL seed_issues_v4.sql: 10 pautas iniciais reais de policiais civis MG (Helios, Olho Vivo, PF, etc.)
- [x] Sidebar: form de cadastro com campos MASP, lotação e aviso de plataforma exclusiva PC-MG
- [x] MASP badge no sidebar (pendente/aprovado) para usuários autenticados
- [x] Admin dashboard para validação manual de registros MASP pendentes (`/admin/validations` + `/api/admin/validations`)
- [x] Votos de issues deduplicados por `user_id` autenticado com fallback compatível por `session_hash`
- [x] Pipeline real de notificações (webhook/Telegram) para novas pautas e votos em `/issues`
- [x] Carregamento de conversas do Supabase quando o usuário autenticado entra no `/chat`
- [x] Pre-commit SSOT: `/home/enio/.egos/hooks/pre-commit` — hook universal para todos os repos EGOS
- [x] Hook Mesh EGOS: `852`, `carteira-livre`, `forja`, `egos-self`, `policia` com symlink SSOT; `br-acc` e `egos-lab` com wrapper SSOT + hook legado
- [x] Security audit 2026-03-28: Fixed 15 HIGH + 9 moderate vulnerabilities across 9 repos, added Dependabot to all repos
- [x] Bootstrap de governança no repo privado `policia`: `AGENTS.md`, `TASKS.md`, `docs/SYSTEM_MAP.md`, `.windsurf/workflows/ovm.md`

## 🏃 P1 - Sprint v5 (Anonymous Identity + Gamification)

- [x] **Email verification flow**: token de confirmação por email (Resend) antes de ativar conta
- [x] **Sistema de identidade anônima**: nickname generator (codinomes policiais) + validação AI de nomes reais (Gemini Flash via OpenRouter)
- [x] **Redesign do registro**: codinome auto-gerado, modo personalizar com validação AI, MASP/lotação opcionais e nunca públicos
- [x] **Gamificação**: sistema de pontos (report=10, issue=5, comment=3, vote=1), ranks policiais (Recruta a Comissário), leaderboard anônimo
- [x] **Mobile bottom nav**: navegação fixa no rodapé para mobile (Home, Chat, Fórum, Relatos, Painel)
- [x] **Copy rules**: remoção de travessões (em-dashes) de todo o copy público
- [x] **Supabase migrations**: aplicar migration_v4 + v5 + v6 + v7 no banco via CLI (lotação, email verification, gamification, MASP canonicalization)
- [x] **Landing page v2**: redesign com 2 opções lado a lado, fluxo completo, código aberto com link GitHub, sem duplicidade de Tópicos
- [x] **Tradução PT-BR**: todas as páginas verificadas e 100% em português acessível (landing, chat, issues, reports, dashboard, sidebar, mobile nav, FAQ)
- [x] **SQL migration governance**: regra documentada em `.guarani/PREFERENCES.md` -- sempre via `supabase db push`, nunca manual
- [x] **Espiral de Escuta**: relatórios com <85% aprovação reabrem rodada de discussão
- [x] **Report flow multi-camada**: usuário itera, IA analisa, revisão humana, votação maioria
- [x] **Audio transcription**: Web Speech API / Whisper para transcrever áudio
- [x] **LGPD consent banner**: consentimento explícito no cadastro (Lei 13.709/2018)
- [x] **User self-service data access**: ver/exportar/deletar dados (LGPD Art. 18)

## 🏃 P1 - Sprint v6 (Biblioteca Jurídica + Dupla Entrada + FAQ)

### Biblioteca Jurídica
- [x] **Página /legislacao**: 27+ leis, súmulas e normativas organizadas por categoria (Federal, Estadual MG, Súmulas, Normativas PCMG)
- [x] **Descrições em linguagem simples**: cada lei com "para que serve" em 1 frase + link oficial (Planalto, ALMG, STF, STJ)
- [x] **Busca client-side**: filtro por nome, assunto ou palavra-chave com normalização de acentos
- [x] **Nav header + mobile**: "Legislação" adicionado ao SiteHeader e MobileNav
- [x] **Referências legais no prompt da IA**: seção REFERÊNCIA LEGAL no prompt.ts para chat e intelligence_report
- [x] **Glossário policial**: termos, siglas e acrônimos operacionais integrados à `/legislacao` com busca compartilhada

### Landing Page Redesign
- [x] **Header fixo com nav completa**: Início, Chat, Sugestão, Tópicos, Legislação, Relatórios, Painel
- [x] **Duas entradas lado a lado**: "Conversar com IA" + "Enviar sugestão direto" (texto livre, sem IA)
- [x] **Fix duplicação de Tópicos**: landing passa a encaminhar o texto livre para `/sugestao`, mantendo o fórum como destino de publicação
- [x] **FAQ completa no bottom**: FAQ ampliada e alinhada ao novo fluxo direto com anexos
- [x] **CTA para Biblioteca Jurídica**: card/banner integrado à landing e CTA final na página jurídica

### Página /sugestao (Texto Livre)
- [x] **Textarea grande**: digitação livre sem interação com IA
- [x] **Upload de arquivos**: drag & drop + botão (PDF, DOC, DOCX, TXT, MD)
- [x] **API /api/upload/parse**: parsing server-side com limite de 5MB e rate limit
- [x] **Mesma pipeline ATRiAN + PII**: validação automática antes de publicar
- [x] **Preview antes de enviar**: usuário vê resultado da validação
- [x] **Categoria/tags opcionais**: classificação da sugestão
- [x] **Histórico local de sugestões**: autosave, reabertura e status (rascunho, validado, publicado)
- [x] **Exportar em PDF/MD**: mesma funcionalidade do chat
- [x] **Histórico remoto de sugestões para usuários logados**: sincronizar drafts/validações com Supabase

### Roadmap Institucional
- [x] **Roadmap integrado**: documento `docs/ROADMAP_INTELIGENCIA_POLICIAL_INTEGRADA.md` conectando `852`, `policia`, `Intelink`, EGOS Intelligence e IPED

## 🏃 P1 - Sprint v8 (Auth SSOT + Email Code Login + LGPD)

- [x] **Auth SSOT consolidation**: `/conta` é agora o ponto único de autenticação; modal de auth removido do Sidebar (~350 linhas)
- [x] **Dynamic base URL**: email verification, password reset e Google OAuth usam `request.origin` em vez de `PUBLIC_BASE_URL` hardcoded
- [x] **Improved error propagation**: rotas de auth retornam status HTTP corretos (401/403/409/503) em vez de genérico 401
- [x] **Password reset UX**: token inválido detectado, URL sincronizada com estado, feedback preservado após registro
- [x] **Email code login (OTP)**: código de 6 dígitos via Resend, SHA-256 hash, 10-min expiry, rate limited (3 códigos/janela)
- [x] **Auto-create on code login**: novo usuário criado automaticamente, redirecionado para onboarding de nickname
- [x] **Login method toggle**: `/conta` oferece "Email e senha" vs "Código por email" no modo login
- [x] **Migration v9**: `auth_codes_852` + `auth_invites_852` com RLS (service_role only)
- [x] **Admin invites API**: GET/POST/DELETE `/api/admin/invites` protegido por admin-auth
- [x] **Admin invites dashboard**: `/admin/invites` com KPI cards, formulário de adição, lista com delete
- [x] **Telemetry events**: `email_code_sent`, `email_code_verified` adicionados
- [x] **Self-service data deletion**: DELETE /api/auth/delete-conversations e /api/auth/delete-account com confirmação dupla no /conta
- [x] **LGPD consent banner**: LgpdBanner no root layout + página /privacidade com política completa (12 seções, Art. 7/18)

## ✅ P1 - Sprint v7 (Smart Correlation + Hot Topics, 2026-03-13)

- [x] **Smart Correlation Engine**: API `/api/correlate` com AI tag extraction (qwen-plus/Gemini) + busca ilike em issues e reports do Supabase
- [x] **Correlation lib**: `src/lib/correlate.ts` com `searchIssuesAndReports()` deduplicated, sorted
- [x] **CorrelationPanel component**: debounced (2.5s, min 50 chars), AI-suggested tags, custom tag input, related issues/reports cards, preview modals
- [x] **Integração /sugestao**: CorrelationPanel + HotTopicsTicker integrados na página de sugestão direta
- [x] **Autosave visual indicator**: green dot pulsante + timestamp "Rascunho salvo HH:MM" no form
- [x] **Hot Topics API**: `/api/hot-topics` com scoring (votes*3 + comments*2 + recency_bonus), revalidate 120s
- [x] **Papo de Corredor page**: `/papo-de-corredor` com top 3 featured, ranked list, category badges, 2-min auto-refresh
- [x] **HotTopicsTicker widget**: sidebar component com top 6 topics, 3-min polling, category dot colors
- [x] **MobileNav atualizado**: "Corredor" (Radio icon) substituiu "Leis" na nav mobile
- [x] **Sidebar atualizado**: link "Corredor" adicionado entre Sugestão e Tópicos
- [x] **ai-provider.ts**: task type `correlation` adicionado, roteado para modelo rápido/econômico
- [x] **Tag handling bidirectional**: tags da IA podem ser aceitas/removidas, tags manuais coexistem
- [x] **Build limpo**: 51 rotas compilam sem erros TypeScript

### Melhorias de Experiência
- [x] **AI Topic Content Engine**: geração de títulos jornalísticos e insights/tabelas estruturadas baseadas em evidências para os tópicos
- [x] **QR Code para delegacias**: gerar QR imprimível que leva ao Tira-Voz, para mural da delegacia
- [x] **Templates de relato**: modelos prontos para problemas comuns (falta de viatura, efetivo, sistema)
- [x] **Redirect canais formais**: botão visível "Denúncia formal" → Corregedoria/Ouvidoria/MP
- [x] **PWA/Offline**: instalar como app no celular, funcionar offline com sync posterior
- [x] **Acessibilidade**: tamanho de fonte ajustável, alto contraste, suporte a leitor de tela
- [x] **Notificação por email**: quando tópico que você votou recebe atividade (daily digest + immediate, opt-in, quiet hours)
- [x] **Modo guiado "Não sei o que falar"**: wizard com perguntas guiadas para quem não sabe por onde começar
- [x] **Document Pipeline (Mensagens Longas & Anexos)**: Colapso UX visual no front, parsing 100% no backend com chunking e Atrian estruturado (`[NOME_REDACTED]`).
- [x] **Verdade Versionada (The EGOS Principle)**: Histórico editável em *múltiplas versões* no `/issues` garantindo autoria em edições (cada contestação vira uma Branch identificável).

## ✅ P1 - Sprint v8.1 (Authentication Cache & SSOT Audit, 2026-03-20)

- [x] Correção genuína de Cache-Control no endpoint `/api/auth/me` para evitar "sessão fantasma" e deslogamento prematuro
- [x] Otimização `{ cache: 'no-store' }` em todas as chamadas de Client Components para checagem de auth
- [x] Deep Audit da Arquitetura (Mapeamento de endpoints e rotas ativas)
- [x] Atualização de `AGENTS.md` e `README.md` com as novas rotas (`/conta`, `/ethik`, `/privacidade`, etc.)



## ⏭️ Backlog
- [x] Dashboard UI com métricas reais Recharts (substituir mock data no /dashboard)
- [x] Migrar report-store de localStorage para Supabase (dual write: local + server)
- [x] Session hashing: cada interação gera um hash único rastreável
- [x] Memória persistente do agente entre sessões (conversation summaries, system prompt)
- [x] Sincronizar `/reports`, `ai_reports_852`, `/issues` com links bidirecionais e filtro por relatório
- [x] Corrigir drift de schema das issues (`ai_report_id`) e deduplicar recorrência de tópicos gerados por IA
- [x] Roteamento inteligente de modelos por tarefa (chat/review/html/intelligence/summary)
- [x] Harden `/start` compartilhado: System Map, module roots, workflows e deploy surface como ativação mandatória
- [x] Eliminar warnings SSR do Recharts no build do /dashboard
- [x] Cross-conversation insight aggregation (temas, padrões, regiões)
- [x] Refinar OG image para proporção real 1200x630
- [x] Decompose `chat/page.tsx` (~450 lines), extract WelcomeScreen, MessageList, InputArea, ExportMenu
- [x] CI/CD pipeline (lint + build + smoke on push/PR)
- [x] Consolidar package manager (remover vestígios de bun, manter npm)
- [x] Pipeline real de notificações do 852 (Telegram/Discord/webhook/admin alerts) acoplado a eventos críticos
- [x] ATRiAN v2: RollingBuffer + StreamingValidator with feature flag (ATRIAN_V2_ENABLED)
- [x] ATRiAN dashboard: visualizar violations no /admin/telemetry
- [x] Expandir KNOWN_ACRONYMS no atrian.ts com siglas específicas de cada delegacia/setor
- [x] Admin view para relatórios compartilhados (autenticado)
- [x] Tool use: web search para dados institucionais (Serper + Brave APIs, testes, docs)
- [x] Voice input (speech-to-text via Browser API) no chat e na sugestão
- [x] Proactive collaboration suggestions (agent sugere temas durante a conversa)
- [x] User-linked conversation persistence (load from Supabase when logged in)
- [x] BYOK: usuários plugam próprias API keys (API backend pronta)
- [x] Fórum: notificações, follow-up mode, integração cross-page
- [x] AI Reports v2: auto-análise a cada 5 relatos, HTML output, padrões cross-report
- [x] Lotação auto-detect via chatbot: mencionar lotação, confirmar e vincular ao perfil
- [x] Suggest external LLMs: sugerir que usuário passe prompt por Claude/Gemini/GPT

## ✅ P2 - Sprint v8.5 (Completed 2026-03-20)

- [x] Unificação do Hub Comunitário: Fórum e Relatos mesclados no Master Hub em `/papo-de-corredor`.
- [x] Limpeza UX: Master Hub assume as responsabilidades do header e links obsoletos foram removidos.
- [x] Conta Simplificada e Administrativa: `/conta` centralizada, sem label 'Provedor', com links de Telemetria (ATRiAN) limitados ao root admin.
- [x] IA Anti-Spam (Qwen): Ajuste imperativo de prompt `isTrivial` bloqueando relatórios vindo de conversas curtas.
- [x] Deploy VPS: Zero-Downtime roll out efetuado na branch contabo.

## ✅ P1 - Sprint v9 (Security Hardening — CVE Mitigation, 2026-03-27)

- [x] **CVE-2026-3910 (Chromium/V8) mitigated**: CVSS 8.8 — Updated Dockerfile base image from `node:20-alpine` to `node:22-alpine`
- [x] **CVE-2026-3909 (Skia) mitigated**: CVSS 8.5 — Same base image update resolves Skia vulnerability
- [x] **Security check script**: `scripts/security-check.sh` for continuous security verification (runs npm audit, checks Dockerfile base image)
- [x] **SecOps report updated**: `docs/gem-hunter/secops-2026-03-21.md` marked as mitigated
- [x] **CRCDM hooks**: Pre/post-commit and pre/post-push hooks installed for cross-repo change detection
- [x] **Push completed**: Security changes deployed to main branch (commit 1c57608)

## 🚨 P0 - Governance Follow-up (Pre-commit SSOT Audit, 2026-03-29)

- [x] **852-GOV-201:** Hook único canônico: `~/.egos/hooks/pre-commit` (symlink). `.husky/pre-commit` substituído por stub de redirecionamento. Decisão: CRCDM universal = hook único.
- [x] **852-GOV-202:** Gaps identificados e fechados: doc-proliferation + SSOT limits + handoff freshness adicionados ao CRCDM hook universal. Checks ativos: gitleaks, regex-secret, doc-prolif, SSOT size, handoff, CRCDM DAG.
- [x] **852-GOV-203:** `docs/SYSTEM_MAP.md` atualizado: hook canônico documentado, VPS Hetzner corrigido, spec local marcada como stub.
- [x] **852-GOV-204:** Contrato resolvido: frente única (CRCDM universal). Sem dual-hook. Sem sobreposição.
- [x] **852-GOV-205:** Plano executado: hook reconciliado → docs atualizados → propagado via governance-sync em 2026-03-29.

## 🚀 P3 - Sprint v10 (Analytics & Performance — 2026-04-09)

### Analytics Avançado
- [x] **Dashboard de engajamento**: métricas de retenção, churn, tempo médio de sessão (lib/analytics.ts + API + UI)
- [x] **Funnel de conversão**: track de landing → chat → report → share completo
- [x] **Heatmap de cliques**: lib/clarity.ts + /admin/clarity + tracking events
- [x] **Análise de sentimento**: lib/sentiment.ts + migration + API + lexicon PT-BR
- [x] **Relatórios exportáveis**: /api/admin/export CSV com BOM para Excel
- [x] **Relatório Master Único**: /api/ai-reports/master + MasterIntelligenceReportSection (consolida todos em 1)
- [x] **Correção scrollbars**: tema dark azul (#1e3a5f) em toda a aplicação

### Performance & Otimização
- [x] **Edge caching**: Cache de hot topics e stats no edge (headers CDN-Cache-Control)
- [x] **Lazy loading**: Code-splitting Recharts (ChartsModule.tsx) + PDF export lazy
- [x] **Database indexing**: 15 índices criados (hot topics, analytics, sentiment)
- [x] **Bundle optimization**: ~25% reduction via lazy loading Recharts/jsPDF/docx

### Integrações Futuras
- [ ] **REDS Integration**: API bridge para consulta de ocorrências (autenticado)
- [ ] **SEI Protocolo**: Geração de protocolos SEI para relatos oficiais
- [ ] **InteliLink Bridge**: Conector para sistema de inteligência policial
- [ ] **Google Drive Export**: Salvar relatórios direto no Drive (OAuth)

### UX & Acessibilidade
- [ ] **Tema claro**: Alternative light mode (toggle dark/light)
- [ ] **Fonte ajustável**: Controles de acessibilidade para idosos
- [ ] **Leitor de tela**: ARIA labels completos em todas as páginas
- [ ] **Keyboard navigation**: Navegação 100% por teclado

## 🚀 P2 - Sprint v11 (MasterReportModal v2.0 — 2026-04-09)

### UX Revolution — Relatório Master
- [x] **Modal 75% tela**: MasterReportModal ocupa 75% da tela desktop, tela cheia mobile
- [x] **1 clique para relatório**: Card na landing abre modal direto (sem navegação de página)
- [x] **Remoção de abas**: "Relatos Compartilhados" e "Gerador de Relatórios" removidos
- [x] **Simplificação ReportsFeed**: Apenas Master Report, sem tabs redundantes

### MasterReportModal v2.0 — Features
- [x] **Tecla ESC**: Fecha modal com Escape key
- [x] **Swipe to close**: Puxe para baixo no topo para fechar (mobile)
- [x] **Focus trap**: Acessibilidade — foco circula dentro do modal
- [x] **Loading skeleton**: Animação pulse durante carregamento
- [x] **Mobile-first**: Menu hamburguer para ações no mobile
- [x] **Pull hint**: Dica visual "Puxe para baixo no topo para fechar"

### Integrações
- [x] **Hot Topics Sidebar**: Tópicos em alta integrados ao modal (desktop)
- [x] **Version History API**: `/api/ai-reports/master/history` + `/[version]`
- [x] **Histórico no modal**: Abas "Tópicos" / "Histórico" no sidebar
- [x] **View versions**: Visualizar versões anteriores do relatório
- [x] **Version badge**: Badge "Atual" na versão mais recente
- [x] **Back to current**: Botão para voltar à versão atual quando vendo antiga

### APIs Novas
- [x] **GET /api/ai-reports/master/history**: Lista últimas 10 versões
- [x] **GET /api/ai-reports/master/history/[version]**: Retorna versão específica

### Arquivos
- [x] `src/components/corredor/MasterReportModal.tsx` — Componente principal
- [x] `src/app/api/ai-reports/master/history/route.ts` — API histórico
- [x] `src/app/api/ai-reports/master/history/[version]/route.ts` — API versão
- [x] `src/components/corredor/ReportsFeed.tsx` — Simplificado (22 linhas)
- [x] `src/app/page.tsx` — Integração modal na landing

## ⏭️ Backlog

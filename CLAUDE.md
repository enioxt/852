# CLAUDE.md — 852 Inteligência (Tira-Voz)

> Lido automaticamente pelo Claude Code CLI ao executar `claude` neste diretório.

## Projeto

**Tira-Voz (852)** — Chatbot institucional anônimo para policiais civis de Minas Gerais. Permite conversa com IA, detecção de PII, compartilhamento de relatos, fórum de pautas (Papo de Corredor), validação ética ATRiAN e identidade anônima gamificada. Deploy em produção: `https://852.egos.ia.br`.

## Arquitetura

```text
852/
├── src/app/             # Next.js 16 App Router
│   ├── (pages)/         # chat, issues, reports, conta, sugestao, legislacao
│   ├── api/             # Routes: chat, auth, correlate, hot-topics, admin
│   └── admin/           # Dashboard admin (telemetria, validações, convites)
├── src/lib/
│   ├── ai-provider.ts   # LLM router: Alibaba Qwen-plus + OpenRouter fallback
│   ├── atrian.ts        # Validação ética de output
│   ├── pii-scanner.ts   # CPF, RG, MASP, telefone, email, REDS, placas
│   ├── report-store.ts  # Persistência localStorage
│   └── correlate.ts     # Smart Correlation Engine
├── .egos/               # Symlink gov compartilhada EGOS
├── .guarani/            # Identidade e preferências locais
├── docker-compose.yml   # Contrato de runtime no VPS (SSOT)
├── AGENTS.md            # Mapa do sistema e capacidades
└── TASKS.md             # Prioridades e sprints (SSOT)
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| **Framework** | Next.js 16 + App Router |
| **Runtime** | Node 20 / npm |
| **LLM Primário** | Alibaba Qwen-plus (DashScope) |
| **LLM Fallback** | Gemini 2.0 Flash via OpenRouter |
| **Banco** | Supabase PostgreSQL (lhscgsqhiooyatkebose) |
| **Analytics** | Microsoft Clarity (vtsny72z0w) |
| **Deploy** | Contabo VPS (porta 3001, Caddy reverse proxy) |

## Comandos Principais

```bash
npm run dev              # Servidor local (porta 3000)
npm run build            # Build de produção
npm run lint             # ESLint
# No VPS (217.216.95.126):
docker compose up -d     # Subir stack
docker compose logs -f   # Ver logs em tempo real
```

## Regras

- Leia `.guarani/PREFERENCES.md` para padrões de código locais
- Leia `.egos/guarani/PREFERENCES_SHARED.md` para padrões EGOS globais
- Commits convencionais: `feat:`, `fix:`, `chore:`, `docs:`
- SQL: sempre via `supabase db push`, nunca manual
- PII: todo output público passa pelo ATRiAN + PII scanner
- Nunca misturar este repo com `carteira-livre` ou `forja` (projetos separados)

## Deploy

```bash
# Produção no VPS Contabo (217.216.95.126):
ssh root@217.216.95.126
cd /opt/852
git pull && docker compose up -d --build
```

## Banco de Dados

Supabase (`lhscgsqhiooyatkebose`). RLS sempre ativado. Tabelas principais:
`telemetry_852`, `reports_852`, `conversations_852`, `issues_852`, `ai_reports_852`, `user_accounts_852`, `auth_codes_852`

---

## Regra: Próxima Task

Quando iniciado neste repositório e perguntado "qual a próxima task?" ou "what's next?":
1. Leia este CLAUDE.md para contexto
2. Leia TASKS.md e identifique a task P0/P1 de maior prioridade incompleta
3. Leia PRs abertos: `gh pr list`
4. Responda com: task ID, descrição, arquivos envolvidos, e próximo passo concreto
Sem fricção. Direto ao ponto.

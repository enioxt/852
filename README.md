# 852 Inteligência — Canal Anônimo para Policiais Civis de MG

> **Versão:** 1.3.0 | **Atualizado:** 2026-05-04 | **Status:** BETA
> **Parte do ecossistema [EGOS](https://github.com/enioxt/egos)**
> Implementação canônica de referência para arquitetura de chatbot do ecossistema. SSOT: [`egos/docs/modules/CHATBOT_SSOT.md`](https://github.com/enioxt/egos/blob/main/docs/modules/CHATBOT_SSOT.md).

Canal de inteligência institucional para os **852 municípios** de Minas Gerais.
Plataforma anônima e segura, baseada no ecossistema EGOS, para coleta, estruturação e análise de relatos de Policiais Civis.

**Live:** [852.egos.ia.br](https://852.egos.ia.br) · **Status:** ritmo reduzido — parceiro parcial.

---

## Para que serve

O efetivo policial produz inteligência operacional valiosa no dia a dia — padrões de crime, lacunas de protocolo, boas práticas locais — mas raramente existe um canal seguro, anônimo e estruturado para registrar e cruzar essas informações.

O 852 preenche esse vazio: é um chatbot de inteligência institucional onde o policial conversa com IA, registra relatos sanitizados (sem PII) e contribui para um fórum colaborativo por voto. O nome vem dos 852 municípios de Minas Gerais — cobertura completa do estado.

Do ponto de vista técnico, o 852 é a implementação mais madura de chatbot dentro do ecossistema EGOS. Toda evolução de arquitetura (streaming, PII scan, ATRiAN, gamificação, exportação) foi validada aqui antes de ser documentada no `CHATBOT_SSOT.md` como padrão para os demais repos.

---

## Funcionalidades principais

- **Chatbot Anônimo** — streaming token-a-token com IA (Qwen-plus via DashScope / Gemini 2.0 Flash fallback)
- **ATRiAN Truth Layer** — validação ética de output: sem fabricação de dados, siglas inventadas ou promessas falsas
- **PII Scanner** — detecção automática de CPF, RG, MASP, telefones, e-mails, REDS, placas e nomes
- **Revisão por IA** — análise de completude da conversa, pontos cegos e sugestões de aprofundamento
- **Report Sharing** — compartilhamento de relatos sanitizados (link + WhatsApp) com controle total do usuário
- **Smart Correlation** — motor de correlação inteligente: tags AI + busca em issues/reports existentes
- **Papo de Corredor** — feed de tópicos quentes com ranking por engajamento (votos + comentários + recência)
- **Sugestão Direta** — texto livre com upload de arquivos, autosave visual, PII/ATRiAN e publicação no fórum
- **Biblioteca Jurídica** — 27+ leis, súmulas e normativas + glossário operacional policial
- **Gamificação** — pontos, ranks policiais (Recruta a Comissário), leaderboard anônimo
- **Identidade Anônima** — codinomes policiais auto-gerados + validação AI de nomes reais
- **Histórico Local** — conversas persistidas no navegador com sidebar colapsável
- **Exportação** — PDF, DOCX, Markdown
- **Telemetria** — Microsoft Clarity + Supabase + logs JSON estruturados + dashboard admin
- **Notificações Operacionais** — webhook/Telegram fire-and-forget para novas pautas e votos
- **Mobile First & Dark Mode** — design Palantir/Linear para inteligência policial
- **API Hardening** — rate limit, validação de payload, fallback explícito de provider

---

## Arquitetura

```text
                        ┌─────────────────────────────┐
                        │        Usuário (Policial)    │
                        └────────────┬────────────────┘
                                     │ HTTPS
                        ┌────────────▼────────────────┐
                        │     Next.js 16 (App Router)  │
                        │  /chat  /sugestao  /papo     │
                        │  /legislacao  /reports       │
                        └──┬──────────┬───────────────┘
                           │          │
            ┌──────────────▼──┐  ┌────▼────────────────┐
            │  AI SDK v6       │  │  Supabase Postgres   │
            │  Vercel AI SDK   │  │  - reports           │
            │                 │  │  - corredor_posts    │
            │  Primary:        │  │  - user_sessions     │
            │  Qwen-plus       │  └─────────────────────┘
            │  Fallback:       │
            │  Gemini 2.0 Flash│
            └──────┬──────────┘
                   │ output
     ┌─────────────▼────────────────────────┐
     │  Pipeline de Conformidade             │
     │  1. PII Scanner (regex + heurística) │
     │  2. ATRiAN Truth Layer (prompt filter)│
     │  3. AI Review (completude + gaps)    │
     └──────────────────────────────────────┘
```

**Fluxo do usuário:**

```text
Landing (/)
  ├── "Iniciar conversa"    → /chat
  │     ├── Quick Actions   → conversa guiada
  │     ├── Texto livre     → resposta streaming
  │     ├── Exportar (PDF/DOCX/MD)
  │     └── "Enviar Relatório" → 3 etapas:
  │           ├── Step 1: PII scan + confirmação
  │           ├── Step 2: Revisão por IA
  │           └── Step 3: Compartilhar (link/WhatsApp/deletar)
  ├── "Escrever direto"     → /sugestao
  ├── "Papo de Corredor"   → /papo-de-corredor
  ├── "Biblioteca Jurídica" → /legislacao
  └── "Ver relatórios"     → /reports
```

---

## Stack técnico

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Runtime | Node 20 / npm |
| IA | Vercel AI SDK v6 (`@ai-sdk/openai` + `@ai-sdk/react`) |
| LLM Primário | Alibaba Qwen-plus via DashScope |
| LLM Fallback | Google Gemini 2.0 Flash via OpenRouter |
| Banco | Supabase PostgreSQL |
| Ética | ATRiAN validation (prompt + output filter) |
| Privacidade | PII Scanner (`@egosbr/guard-brasil` v0.2.3) |
| UI | TailwindCSS 4 + Lucide Icons + Recharts |
| Exportação | jsPDF + docx + file-saver |
| Analytics | Microsoft Clarity |
| Infra | Hetzner VPS + Docker Compose + Caddy |

---

## Quick Start

```bash
# 1. Clonar
git clone https://github.com/enioxt/852.git && cd 852

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# editar .env com suas chaves

# 4. Rodar em desenvolvimento
npm run dev  # http://localhost:3000
```

---

## Variáveis de ambiente

| Variável | Exemplo | Obrigatório | Descrição |
|----------|---------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJh...` | sim | Chave pública Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJh...` | sim | Chave service role (server-side) |
| `DASHSCOPE_API_KEY` | `sk-...` | sim | LLM Qwen-plus via DashScope |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | sim | LLM Gemini fallback |
| `TELEGRAM_BOT_TOKEN` | `123:ABC...` | opcional | Notificações operacionais |

---

## Deploy

```bash
# Build
npm run build

# Enviar para VPS Hetzner
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.env' \
  --exclude='.git' ./ hetzner:/opt/852/

# Subir containers
ssh hetzner "cd /opt/852 && docker compose build --no-cache && docker compose up -d"

# Verificar
curl -I https://852.egos.ia.br
```

Scripts disponíveis:
```bash
npm run smoke:vps       # smoke test no VPS
npm run smoke:public    # smoke test em produção
npm run release:prod    # release completo para Hetzner
```

---

## Ecossistema EGOS — Dependências

| Repo | Relação | Status |
|------|---------|--------|
| [egos](https://github.com/enioxt/egos) | Kernel upstream — Guard Brasil, ATRiAN, governança | PROD |
| intelink *(privado)* | Repo irmão — inteligência policial (contexto similar) | PROD |
| policia *(privado)* | Repo irmão — pipeline DHPP (transcrição, documentos) | BETA |

**Upstream (o que este repo usa):** Guard Brasil PII Scanner (`@egosbr/guard-brasil`), padrão ATRiAN, `CHATBOT_SSOT.md` como referência canônica de arquitetura.

**Downstream (quem usa este repo):** serve como SSOT de referência para arquitetura de chatbot de todos os outros repos do ecossistema.

---

## Estrutura de pastas

```text
852/
├── src/
│   ├── app/                   # App Router (pages + API routes)
│   │   ├── api/               # Endpoints: chat, reports, corredor, eval
│   │   ├── chat/              # Chatbot principal
│   │   ├── papo-de-corredor/  # Fórum de tópicos
│   │   ├── sugestao/          # Sugestão direta
│   │   ├── legislacao/        # Biblioteca jurídica
│   │   └── reports/           # Visualização de relatórios
│   ├── components/            # UI components reutilizáveis
│   ├── lib/                   # PII scanner, ATRiAN, AI client
│   └── eval/                  # Eval runner (runner.ts)
├── scripts/                   # Deploy, smoke tests, release
├── tests/                     # Dependency analyzer
├── docs/                      # Documentação interna
└── .env.example               # Template de variáveis
```

---

## Roadmap

| Prioridade | Feature |
|------------|---------|
| **P1** | Espiral de Escuta (reports <85% aprovação reabrem discussão) |
| **P1** | Correlação em /chat (trigger após resposta AI) |
| **P1** | Resumos AI no Papo de Corredor (digest semanal) |
| **P1** | Banner de consentimento LGPD + autoatendimento de acesso a dados |
| **P2** | ATRiAN v2: integração NeMo Guardrails |
| **P2** | Input por voz (speech-to-text) |

---

## Contribuindo

Leia `CLAUDE.md` antes de contribuir. Padrões obrigatórios:
- Commits convencionais (`feat:`, `fix:`, `docs:`, `chore:`)
- TypeScript estrito (zero `any` implícito)
- Teste antes de PR: `npm run smoke:local`
- Sem secrets em código — use `.env`

---

## Licença

MIT

---

*Parte do ecossistema [EGOS](https://egos.ia.br) — Governance Kernel for AI Systems.*

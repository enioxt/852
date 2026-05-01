# 852 Inteligencia

> **Versão:** 1.3.0 | **Atualizado:** 2026-05-01 | **Status:** BETA
> **Parte do ecossistema [EGOS](https://github.com/enioxt/egos)**
> 🏆 **Implementação Canônica de Referência** — SSOT para arquitetura de chatbot do ecossistema. Veja [`egos/docs/modules/CHATBOT_SSOT.md`](https://github.com/enioxt/egos/blob/main/docs/modules/CHATBOT_SSOT.md).

Canal de inteligência institucional para os **852 municípios** de Minas Gerais.
Plataforma anônima e segura baseada no ecossistema EGOS para coleta, estruturação e análise de relatos de Policiais Civis.

**Live:** [852.egos.ia.br](https://852.egos.ia.br) · **Status:** ⏸️ Ritmo reduzido — parceiro parcial.

---

## Features

- **Chatbot Anônimo** — Streaming token-by-token com IA (Qwen-plus / Gemini 2.0 fallback)
- **ATRiAN Truth Layer** — Validação ética de output: sem fabricação de dados, siglas inventadas ou promessas falsas
- **PII Scanner** — Detecção automática de CPF, RG, MASP, telefones, emails, REDS, placas e nomes
- **Revisão por IA** — Análise de completude da conversa, pontos cegos e sugestões de aprofundamento
- **Report Sharing** — Compartilhamento de relatos sanitizados (link + WhatsApp) com controle total do usuário
- **Smart Correlation** — Motor de correlação inteligente: AI tags + busca em issues/reports existentes
- **Papo de Corredor** — Feed de tópicos quentes com ranking por engajamento (votos + comentários + recência)
- **Sugestão Direta** — Texto livre com upload de arquivos, autosave visual, PII/ATRiAN e publicação no fórum
- **Biblioteca Jurídica** — 27+ leis, súmulas e normativas + glossário operacional policial
- **Gamificação** — Pontos, ranks policiais (Recruta a Comissário), leaderboard anônimo
- **Identidade Anônima** — Codinomes policiais auto-gerados + validação AI de nomes reais
- **Histórico Local** — Conversas persistidas no navegador com sidebar colapsável
- **Exportação** — PDF, DOCX, Markdown
- **Telemetria** — Microsoft Clarity + Supabase + structured JSON logs + admin dashboard
- **Notificações Operacionais** — Webhook/Telegram fire-and-forget para novas pautas e votos
- **Mobile First & Dark Mode** — Design Palantir/Linear para inteligência policial
- **API Hardening** — Rate limit, validação de payload, fallback explícito de provider

---

## User Flow

```text
Landing (/)
  |-- "Iniciar conversa" -> /chat
  |     |-- Quick Actions -> starts conversation
  |     |-- Free text -> AI streaming response
  |     |-- Export (PDF/DOCX/MD)
  |     |-- "Enviar Relatório" -> 3-step review
  |     |     |-- Step 1: PII scan + user accepts removals
  |     |     |-- Step 2: AI review (completude, sugestões)
  |     |     '-- Step 3: Share (link, WhatsApp, delete)
  |     '-- Sidebar (history, Home, Reports, Corredor, FAQ)
  |
  |-- "Escrever direto" -> /sugestao
  |-- "Papo de Corredor" -> /papo-de-corredor
  |-- "Biblioteca Jurídica" -> /legislacao
  '-- "Ver relatórios" -> /reports
```

---

## Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **Runtime** | Node 20 / npm |
| **AI** | Vercel AI SDK v6 (`@ai-sdk/openai` + `@ai-sdk/react`) |
| **LLM Primary** | Alibaba Qwen-plus via DashScope |
| **LLM Fallback** | Google Gemini 2.0 Flash via OpenRouter |
| **Database** | Supabase PostgreSQL |
| **Ethics** | ATRiAN validation (prompt + output filter) |
| **Privacy** | PII Scanner (regex + heuristics) |
| **UI** | TailwindCSS 4 + Lucide Icons + Recharts |
| **Export** | jsPDF + docx + file-saver |
| **Analytics** | Microsoft Clarity |
| **Deploy** | Hetzner VPS + Docker Compose + Caddy |

---

## Quick Start

```bash
git clone https://github.com/enioxt/852.git && cd 852
npm install
cp .env.example .env   # Configure API keys
npm run dev            # http://localhost:3000
```

---

## Deploy

```bash
npm run build
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.env' \
  --exclude='.git' ./ hetzner:/opt/852/
ssh hetzner "cd /opt/852 && docker compose build --no-cache && docker compose up -d"
curl -I https://852.egos.ia.br
```

---

## Ecossistema EGOS — Dependências

| Repo | Relação | Status |
|------|---------|--------|
| [egos](https://github.com/enioxt/egos) | Kernel upstream — Guard Brasil, ATRiAN, governança | PROD |
| intelink *(privado)* | Repo irmão — inteligência policial (contexto similar) | PROD |
| policia *(privado)* | Repo irmão — pipeline DHPP (transcrição, documentos) | BETA |

**Upstream (o que este repo usa):** Guard Brasil PII Scanner, padrão ATRiAN, CHATBOT_SSOT como referência canônica.

**Downstream (quem usa este repo):** serve como SSOT de referência para arquitetura de chatbot de todos os outros repos do ecossistema.

---

## Roadmap

| Prioridade | Feature |
|------------|---------|
| **P1** | Espiral de Escuta (reports <85% approval reopen discussion) |
| **P1** | Correlation in /chat (trigger after AI response) |
| **P1** | AI summaries in Papo de Corredor (weekly digest) |
| **P1** | LGPD consent banner + self-service data access |
| **P2** | ATRiAN v2: NeMo Guardrails integration |
| **P2** | Voice input (speech-to-text) |

## License

MIT

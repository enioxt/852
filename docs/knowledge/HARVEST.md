# Knowledge Harvest — 852 & EGOS Ecosystem

## Record: 2026-03-21 | Arquitetura de Monetização (Agente ETHIK) e Chaves GCP Efêmeras

### 1. O Problema
Monetizar APIs (ex: `/api/chat` Qwen/Gemini) mantendo o acesso às LLMs estritamente controlado. Evitar vazamento de chaves perenes e overbilling (fat billing failure) no Google Cloud Console / Alibaba DashScope.

### 2. A Solução: Gateway Dinâmico
O Agente ETHIK intercepta chamadas não autenticadas em rotas comerciais. Quando o cliente paga via **x402 protocol** (USDC on-chain, instant settlement), o Gateway valida a TX e, usando o Service Account do GCP, chama a API de *API Keys* (`apikeys.googleapis.com`) para gerar uma **chave temporária, restrita e com quota injetada (ex: quota de apenas $0.05 ou 50 requests)**. 

Essa chave é devolvida ao cliente, garantindo que o teto de gastos do cliente na infra do GCP jamais exceda o que ele acabou de pagar via USDC/PIX.

### 3. O Fluxo de Interconexão (A Tríade)
- **Agente ETHIK (Tokenomics e Gateway)**: Libera o acesso via pagamentos e distribui Pontos EGOS (Série Fibonacci).
- **Agente ATRiAN (Compliance)**: Intercepta o request legitimado pela chave e avalia a ética das intenções antes de usar os tokens GCP/Alibaba.
- **Agente Mycelium (Auditoria e Malha)**: Recebe os logs semânticos (`gcp.key.issued`, `atrian.pass`, etc) para gerar relatórios de transparência.

### 4. Meta-Prompt & Autonomia
Essas arquiteturas só funcionam porque os meta-prompts do ATRiAN (`prompt.ts`) têm **autoridade atômica**. Ele age como o *Kill Switch* final. O Agente ETHIK apenas viabiliza recursos financeiros—o ATRiAN viabiliza a conduta moral do uso dessas chaves.

---

## Record: 2026-03-27 | NDIA - Go-to-Market Institucional Cauteloso

### 1. O Contexto
Análise de 6 documentos NDIA (Núcleo de Desenvolvimento e IA da PCMG Patos de Minas) revelou inconsistências críticas e necessidade de estratégia política cautelosa.

### 2. Inconsistências Críticas Encontradas
- **CAPEX:** R$ 126-183k (pitch) vs R$ 314-320k (doc estratégico) — diferença de 2,5x
- **Payback:** < 3 meses (pitch irrealista) vs 10-16 meses (realista)
- **População:** 169k vs 155k habitantes
- **Hardware:** Ryzen 9 vs Threadripper PRO 64 cores

### 3. Benchmarks Nacionais Analisados
- **Goiás (IA Contra o Crime):** 100+ casos/30 dias, resultados mensuráveis
- **Roraima (Infopol):** Sistema próprio desenvolvido
- **Santa Catarina:** Laboratório inaugurado Jan/2026
- **FNSP 2025:** R$ 1,4 bilhão executado

### 4. Lição Principal: Cautela Institucional
Em ambientes policiais, credibilidade é construída com:
1. **Baseline antes de promessas** — medir "antes" antes de projetar "depois"
2. **Recursos garantidos antes de anúncios** — não prometer sem dinheiro no banco
3. **Resultados antes de visibilidade** — evidência, não intenção
4. **Governança antes de inovação** — compliance LGPD/CNJ/Framework IA

### 5. Estratégia Recomendada (Fases)
- **Fase 0 (Agora):** Documentação, baseline, governança (silencioso)
- **Fase 1-2:** Aprovação política low-profile + captação recursos
- **Fase 3-4:** Infraestrutura + pilotos internos (silencioso)
- **Fase 5+:** Lançamento público SÓ DEPOIS de resultados comprovados

### 6. Documentos Criados
- `/docs/proposta/NDIA_CONSOLIDADO_MELHORIAS.md` — Análise consolidada
- `/docs/proposta/NDIA_GTM_ESTRATEGIA_INSTITUCIONAL.md` — Estratégia GTM cautelosa

### 7. Princípios Não-Negociáveis
> "Nunca overpromise. Baseline primeiro. Recursos garantidos. Governança sólida. Resultados antes de visibilidade."

---

## Record: 2026-03-28 | UI/UX Design Research — Scrollbar & Button Best Practices

### 1. O Contexto
Sessão de pesquisa profunda para melhorar a interface de relatórios no 852 (papo-de-corredor), focando em scrollbar dark mode, integração fluida de modal, e design de botões.

### 2. Problemas Identificados
- **Scrollbar branca** em dark mode — contrasta mal, precisa ser escura
- **Relatório desconectado** — visualmente separado da página, falta integração
- **Botões sem hierarquia** — affordance ruim, shadows ausentes

### 3. Research Findings

#### Scrollbar Styling (MDN + Chrome Dev)
```css
/* CSS Scrollbars Module Level 1 */
scrollbar-width: thin;
scrollbar-color: #404040 #171717; /* thumb track */

/* Webkit fallback */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #171717; }
::-webkit-scrollbar-thumb { background: #404040; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #525252; }
```

**Princípios:**
- Contraste suficiente (WCAG 2.1)
- Hover states para interatividade
- Tamanho mínimo 8px

#### Modal Integration (Eleken + NN/G)
- Overlay escuro com backdrop-blur
- Animações suaves (Framer Motion)
- Manter design system consistente
- Full-screen em mobile quando necessário

#### Button Design (LogRocket + MagicUI + Balsamiq)
- Touch target: 48px (Google) / 44px (WCAG)
- Corner radius: ~30% da altura
- Drop shadows: X:0, Y:30%, Blur:50%, Spread:-30%
- Padding horizontal: ~50% da altura
- Hierarquia: Primary (sólido), Secondary (outline), Tertiary (ghost)
- Estados: default, hover (+10% brightness), active (scale 0.98)

### 4. Implementation Plan
1. **Scrollbar styling** no container do iframe
2. **Framer Motion** para transições suaves
3. **Button redesign** com shadows, hover states
4. **Visual integration** com border highlight e shadow elevado

### 5. Arquivo Criado
- `.windsurf/workflows/stitch-design-report-ui.md` — Meta-prompt para cloud execution

### 6. Sources
MDN Web Docs, Chrome Developers, LogRocket, Eleken UX, NN/G, MagicUI, Balsamiq

---

## Record: 2026-03-29 | Pre-commit Governance Audit — Runtime vs. Local Spec

### 1. Verdade Verificada
- **Runtime ativo no 852:** `.git/hooks/pre-commit -> /home/enio/.egos/hooks/pre-commit`
- **Spec local presente mas não ativado por wiring:** `852/.husky/pre-commit`
- **Evidência de não ativação do Husky local:** sem `prepare` no `package.json` e sem `core.hooksPath` configurado
- **Hooks adicionais reais no repo:** `.git/hooks/post-commit`, `.git/hooks/pre-push`, `.git/hooks/post-push` com CRCDM

### 2. Taxonomia Útil
- **Runtime Hook:** o que realmente bloqueia ou permite commits/pushes no ambiente atual
- **Shadow Spec:** implementação local versionada no repo, mas sem prova de instalação ativa
- **Historical SSOT References:** `TASKS.md`, `SYSTEM_MAP.md` e handoffs que descrevem o estado anterior ou parcial
- **Cross-Repo Extension Hooks:** hooks CRCDM que adicionam logging DAG, impacto e alertas cross-repo além do bloqueio local

### 3. Diferença Material Entre as Superfícies
- `~/.egos/hooks/pre-commit` está orientado a **CRCDM/mesh telemetry**: impacto, DAG, contexto cross-repo, logging e warnings operacionais
- `852/.husky/pre-commit` está orientado a **policy enforcement local**: secrets scan, doc proliferation, limites SSOT, handoff freshness e governance drift hint
- Conclusão: as duas superfícies não são equivalentes; uma reconciliação explícita é necessária antes de chamar qualquer uma de SSOT canônico

### 4. Padrão de Execução sem Duplicidade
- **Frente A — Runtime Canonicalization:** decidir o hook canônico, instalar de forma verificável, comparar checks e eliminar drift entre runtime e spec
- **Frente B — Policy & Dissemination:** atualizar docs/tasks/mapas, classificar checks por tipo (`blocking`, `warning`, `telemetry`, `cross-repo`) e propagar a matriz de adoção para outros repos
- Regra: a Frente B não deve declarar SSOT final antes da Frente A fechar a matriz de verdade

### 5. Ordem Segura para Próximo Agente
1. Comparar `~/.egos/hooks/pre-commit` vs `.husky/pre-commit`
2. Decidir canônico + estratégia de instalação
3. Validar runtime real no repo
4. Só então atualizar `SYSTEM_MAP`, `TASKS`, handoff e disseminação

### 6. Sinal de Maturidade
Não basta existir `.husky/pre-commit` no repo. A maturidade correta exige: **arquivo versionado + instalação verificável + docs coerentes + adoção cross-repo rastreável**.

---

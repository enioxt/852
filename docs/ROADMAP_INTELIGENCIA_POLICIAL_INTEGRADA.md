# Roadmap de Inteligência Policial Integrada

> **Data:** 2026-03-13
> **Escopo:** Tira-Voz + `/home/enio/policia` + Intelink + EGOS Intelligence + IPED
> **Objetivo:** consolidar a trilha de evolução para uma malha institucional de coleta, triagem, análise, documentação e inteligência por grafos

---

## Verified

### 1. Intake institucional já existe no Tira-Voz

- O `852` já possui entrada conversacional em `/chat`, fórum público em `/issues`, relatórios em `/reports`, revisão por IA em `/api/review`, PII scanner em `src/lib/pii-scanner.ts` e guardrail ATRiAN em `src/lib/atrian.ts`.
- Nesta sessão, foi adicionada a entrada direta `/sugestao`, com upload de `PDF`, `DOC`, `DOCX`, `TXT` e `MD`, preview sanitizado, exportação e publicação como tópico no sistema já existente de issues.
- A rota `/api/upload/parse` foi criada para extrair texto dos anexos com limite de 5MB.

### 2. O workspace `/home/enio/policia` já resolve parte crítica da operação investigativa sensível

Fontes verificadas:
- `/home/enio/policia/AGENTS.md`
- `/home/enio/policia/README.md`
- `/home/enio/policia/TASKS.md`
- `/home/enio/policia/scripts/transcribe.py`
- `/home/enio/policia/scripts/cs_to_docx.py`

Capacidades verificadas:
- Transcrição automatizada de mídias de WhatsApp e arquivos como `.ogg`, `.opus`, `.mp3`, `.wav`, `.webm`, `.mp4`.
- Pipeline com `Groq whisper-large-v3` como primário e `OpenAI whisper-1` como fallback.
- Normalização local via `ffmpeg`.
- Geração de entregável final em `.docx` oficial por injeção em template institucional.
- Regras fortes de sigilo, não inferência e preservação de formato oficial para comunicação de serviço.

### 3. O Intelink já comprova maturidade de análise relacional e visualização por grafos

Fontes verificadas:
- `/home/enio/egos-lab/docs/INTELINK_IDENTITY.md`
- `/home/enio/egos-lab/apps/intelink/README.md`
- `/home/enio/egos-lab/apps/intelink/lib/intelligence/graph-aggregator.ts`
- `/home/enio/egos-lab/apps/intelink/lib/intelink/graph-algorithms.ts`
- `/home/enio/egos-lab/docs/agentic/INTELINK_FEATURES_ANALYSIS.md`
- `/home/enio/egos-lab/apps/intelink/docs/INTELINK_GLOSSARY.md`

Capacidades verificadas:
- Dualidade produto + engine: `Intelink Policial` e `Intelink Cortex`.
- Visualização de entidades, vínculos, timeline, relatórios e telemática.
- Agregação de dossiê por entidade com travessia recursiva do grafo.
- Algoritmos de grafos já implementados: componentes conectados, caminhos, vizinhança, estatísticas, link prediction, Adamic-Adar, Jaccard, common neighbors e preferential attachment.
- Estratégia declarada de `Graph First`.
- Plataforma em evolução para cruzar 79 bases públicas brasileiras.
- Regras terminológicas maduras: `investigação`, `vínculo`, `cross-case`, `entidade`, `evidência`.

### 4. O EGOS Intelligence já tem base OSINT real e arquitetura multi-fonte

Fonte verificada:
- `/home/enio/egos-lab/docs/PLANO_INTELIGENCIA_OSINT.md`

Capacidades verificadas:
- Plano explícito de rede de inteligência aberta para dados públicos brasileiros.
- Fontes já integradas ou mapeadas: Querido Diário, DadosJusBr/Extrateto, GitHub, OpenRouter, Supabase.
- Bots ativos em Discord, Telegram e roteadores de IA.
- Arquitetura planejada por camadas: usuários, roteador de IA, tools OSINT, APIs/bancos.

### 5. Há evidência concreta de customização possível do IPED para grafo e análise visual

Fontes verificadas:
- `/home/enio/egos-lab/contrib/IPED/iped-app/resources/config/conf/GraphConfig.json`
- `/home/enio/egos-lab/contrib/IPED/iped-app/src/main/java/iped/app/graph/AppGraphAnalytics.java`

Capacidades verificadas:
- O fork/contrib do IPED inclui superfície dedicada de `graph analytics`.
- Há suporte para nós, arestas, layouts, expansão de caminhos, busca de links e exportação de imagem.
- Isso reforça a viabilidade de uma trilha de perícia digital conectada à camada relacional do Intelink.

---

## Inferred

### 1. O papel ideal do Tira-Voz é ser a camada de intake e priorização

Inferência:
- O `852` já está bem posicionado para funcionar como porta de entrada segura, anônima e orientada por linguagem natural.
- O sistema pode receber relatos, documentos e sinais fracos da base operacional, aplicar sanitização, classificar por tema e gerar trilhas para análise posterior.

### 2. O papel ideal do repo `policia` é ser a camada sensível e formal

Inferência:
- O workspace `policia` não deve ser substituído pelo `852`.
- Ele deve receber apenas material já triado e autorizado para trabalho interno, especialmente quando houver mídia, OVM, REDS, OS e necessidade de gerar peça oficial.

### 3. O Intelink é o candidato natural para a camada de fusão relacional

Inferência:
- Entre os projetos avaliados, Intelink é o que já demonstra melhor encaixe para:
  - resolução de entidades
  - grafo de vínculos
  - cross-case
  - timeline investigativa
  - ranking de conexões ocultas
  - relatórios de inteligência por entidade

### 4. O EGOS Intelligence cobre a inteligência aberta e a camada externa de contexto

Inferência:
- O plano OSINT permite enriquecer relatos internos com contexto público: contratos, diários oficiais, vínculos empresariais, doações, bases públicas e anomalias administrativas.
- Essa trilha pode servir tanto para controle externo quanto para apoio a investigações patrimoniais e redes complexas, desde que respeitados os limites legais e de sigilo.

---

## Proposed

## Arquitetura-alvo em 5 camadas

### Camada 1 — Intake protegido

**Sistema:** `852 / Tira-Voz`

Função:
- Receber relato livre, conversa, documento e sinal operacional.
- Sanitizar PII e aplicar guardrails.
- Classificar tema, urgência, categoria e recorrência.
- Converter parte do input em pauta pública, parte em fila analítica, parte em triagem privada.

Entregas propostas:
- Templates guiados por tipo de problema.
- Encaminhamento por trilha: fórum público, triagem institucional, análise reservada.
- Captura estruturada de anexos e metadados mínimos.

### Camada 2 — Triagem analítica institucional

**Sistema:** `Tira-Voz + painel interno futuro`

Função:
- Consolidar padrões recorrentes por lotação, tema, sistema, região e impacto.
- Separar pauta coletiva de dado sensível.
- Produzir lote priorizado para trabalho analítico.

Entregas propostas:
- Fila de triagem por categoria.
- Heatmap de recorrência sem expor unidade específica.
- Score composto: volume, criticidade, recorrência, impacto operacional.

### Camada 3 — Operação investigativa sensível

**Sistema:** `/home/enio/policia`

Função:
- Processar mídia, OVM, REDS, ordens de serviço e comunicações de serviço.
- Gerar documentos oficiais e trilha probatória interna.

Entregas propostas:
- Conector futuro entre itens autorizados da triagem e uma estrutura de caso em `policia/casos/`.
- Checklist de importação segura.
- Padrão de nomenclatura de caso e mídia.

### Camada 4 — Fusão relacional e grafo de inteligência

**Sistema:** `Intelink`

Função:
- Resolver entidades.
- Construir vínculos.
- Detectar `cross-case`.
- Calcular centralidade, caminhos, vizinhança, clusters e possíveis vínculos ocultos.

Entregas propostas:
- Adaptador para importar insumos selecionados do `policia` e do `852`.
- Painel de `cross-case` para pessoas, veículos, telefones, empresas e endereços.
- Modo `investigação policial` e modo `inteligência pública` compartilhando o mesmo engine.

### Camada 5 — Contexto externo e OSINT

**Sistema:** `EGOS Intelligence`

Função:
- Enriquecer entidades e eventos com dados públicos.
- Detectar anomalias administrativas, patrimoniais e relacionais.
- Apoiar inteligência patrimonial, financeira e de rede.

Entregas propostas:
- Priorização de fontes T1 do Intelink para integração prática.
- Conector de contexto público por CNPJ, empresa, contrato, licitação e doação eleitoral.
- Relatório de enriquecimento externo separado da prova interna.

---

## Roadmap recomendado

### Fase 0 — Governança e separação de domínios

- Definir contrato de dados entre `852`, `policia` e `Intelink`.
- Formalizar o que pode sair do intake público para trilha interna.
- Formalizar o que é dado operacional, dado sensível, dado público e dado probatório.

### Fase 1 — Intake inteligente e triagem segura

- Consolidar `/sugestao` como porta de entrada de texto livre + anexos.
- Adicionar modelos guiados por tipo de demanda.
- Criar fila de triagem e classificação operacional.
- Adicionar roteamento explícito: público, reservado, formal.

### Fase 2 — Documentos, mídia e formalização

- Integrar transcrição e revisão documental do repo `policia` com fluxo de triagem aprovado.
- Padronizar o pacote mínimo de caso: narrativa, mídia, anexos, resumo, peça oficial.
- Preparar conexão futura entre relato triado e pasta de caso.

### Fase 3 — Grafo investigativo e cross-case

- Usar Intelink como engine para pessoa, telefone, veículo, empresa, local e evento.
- Ligar ocorrências, mídias, documentos e entidades em timeline + grafo.
- Ativar painéis de conexões prováveis e vínculos cruzados.

### Fase 4 — OSINT e inteligência patrimonial

- Integrar fontes públicas prioritárias do plano EGOS Intelligence.
- Permitir enriquecimento contextual sem misturar dado aberto com prova interna.
- Produzir relatórios de risco, anomalia e exposição por entidade.

### Fase 5 — Perícia digital e análise visual avançada

- Explorar trilha IPED customizada para extração, vínculo e visualização de evidências digitais.
- Exportar visão relacional para relatórios, imagem e dossiês executivos.
- Preparar base para análise preditiva limitada e auditável.

---

## Prioridades práticas para o próximo ciclo

### P0

- Estabilizar `/sugestao` e `/api/upload/parse` com validação local.
- Fechar navegação e glossário no `852`.
- Documentar contrato inicial de integração entre intake e triagem.

### P1

- Criar adaptador de triagem: `sugestão -> item analítico`.
- Definir esquema comum de entidade: pessoa, veículo, telefone, empresa, local, documento, evidência.
- Criar documento de boundary legal e operacional entre dado público, dado institucional e dado probatório.

### P2

- Testar importação controlada para Intelink.
- Prototipar `cross-case` com dados sintéticos.
- Prototipar esteira `relato -> triagem -> caso -> grafo -> relatório`.

---

## Riscos e travas

## Verified

- O repo `policia` tem regras explícitas de sigilo e não inferência.
- Intelink ainda vive uma transição entre produto policial e engine genérico.
- A trilha OSINT é poderosa, mas precisa de fronteira clara para não contaminar análise interna com inferência excessiva.

## Proposed

- Nunca misturar automaticamente material público com material probatório sem marcação de origem.
- Nunca promover relato anônimo a “fato” sem revisão humana.
- Nunca usar predição como base única de decisão operacional.
- Toda integração entre os domínios deve preservar trilha de auditoria, origem e autorização.

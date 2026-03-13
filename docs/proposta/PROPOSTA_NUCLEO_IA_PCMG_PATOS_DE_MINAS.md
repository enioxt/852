# PROPOSTA DE CRIACAO DO NUCLEO DE DESENVOLVIMENTO E INTELIGENCIA ARTIFICIAL

## Policia Civil de Minas Gerais — Delegacia Regional de Patos de Minas

**Versao:** 1.0
**Data:** Marco de 2026
**Classificacao:** Documento Institucional — Uso Interno e Externo
**Destinatarios:** Chefia da Policia Civil de MG, Delegados Regionais, Deputados Estaduais e Federais, Vereadores, Secretaria de Seguranca Publica de MG

---

## SUMARIO EXECUTIVO

A presente proposta visa a criacao formal do **Nucleo de Desenvolvimento e Inteligencia Artificial (NDIA)** na Delegacia Regional de Patos de Minas, vinculado a Policia Civil de Minas Gerais (PCMG). O nucleo sera **pioneiro no Brasil** como unidade de desenvolvimento de IA dentro de uma Policia Civil estadual, com capacidade de:

- Desenvolver ferramentas proprias de automacao e inteligencia para investigacao
- Rodar e treinar modelos de linguagem (LLM) localmente, sem dependencia de nuvem
- Processar grandes volumes de dados documentais
- Prestar servico de tecnologia para todo o estado de Minas Gerais
- Formar multiplicadores em IA aplicada a seguranca publica

O investimento total estimado e de **R$ 140.000 a R$ 215.000** em equipamentos e implantacao inicial, mais **R$ 2.500 a R$ 3.600 mensais** em operacao recorrente. Desse valor, uma parte mantem a base minima de producao no ar (VPS, banco, dominio, APIs e observabilidade) e outra parte acelera desenvolvimento, manutencao e pesquisa aplicada em IA. Os ganhos em produtividade, desoneramento de servidores e modernizacao institucional justificam amplamente o investimento.

---

## 1. CONTEXTO E JUSTIFICATIVA

### 1.1 O Cenario Nacional

O Brasil vive um momento historico de investimento em inteligencia artificial aplicada a seguranca publica:

- **Plano Brasileiro de Inteligencia Artificial (PBIA 2024-2028):** O governo federal lancou o plano "IA para o Bem de Todos" com **R$ 23 bilhoes** em investimentos previstos, incluindo infraestrutura soberana, capacitacao e IA no setor publico (Decreto, 2024).

- **Projeto INSPIRE (MCTI/MGI):** Contrato de **R$ 390 milhoes** com o CPQD para integrar bases de dados governamentais e desenvolver solucoes de IA para politicas publicas, com foco em inovacao, responsabilidade e etica (Finep/FNDCT, 2025).

- **Portaria do Ministerio da Justica (junho/2025):** Autorizou formalmente o uso de inteligencia artificial em investigacoes criminais por todas as forcas policiais federais e estaduais que recebem recursos do Fundo Nacional de Seguranca Publica (FNSP).

- **Projeto de Lei — Senado Federal (2025):** Proposta de destinacao de **0,5% do FNSP** exclusivamente para investimentos em Tecnologia da Informacao e Comunicacao (TIC), incluindo IA.

Esse ambiente cria uma **janela normativa e orcamentaria favoravel** para projetos que combinem inovacao, governanca, rastreabilidade e protecao de direitos fundamentais no uso de IA pela seguranca publica.

### 1.2 O Que Outras Instituicoes Ja Estao Fazendo

| Instituicao | Projeto | Investimento/Escala |
|---|---|---|
| **PM de Sao Paulo** | "Fabrica de Inteligencia Artificial" — centro de P&D para treinar modelos de IA proprios para seguranca publica | Infraestrutura de alto desempenho, parceria com universidades |
| **Governo de Goias** | "IA Contra o Crime" — ferramenta de IA incorporada ao trabalho das forcas policiais goianas | Lancamento jan/2026, cobertura estadual |
| **Prefeitura do Rio (CIVITAS)** | Sistema IRIS — 20.000 cameras inteligentes com IA ate 2028 | Maior sistema urbano de vigilancia do pais |
| **Policia Federal + ABDI** | Projeto MITRA Nacional — IA e IoT para seguranca de fronteiras | Acordo de Cooperacao Tecnica, nov/2025 |
| **PC de Roraima** | Modernizacao completa com IA, 400+ computadores, 130 notebooks | **R$ 3,5 milhoes** investidos em 2025 |
| **PC de Santa Catarina** | Inquerito Policial Digital — digitalizacao total do fluxo de IP | Desenvolvimento interno (Getin/Gepla) |
| **Interpol** | AI for Law Enforcement — programa global de capacitacao em IA para policias | Parcerias com 194 paises-membros |

### 1.3 A Realidade Atual em Patos de Minas

A Delegacia Regional de Patos de Minas ja iniciou, por iniciativa propria e sem recursos formais dedicados, o desenvolvimento de ferramentas de tecnologia que demonstram claramente a viabilidade e o potencial de um nucleo estruturado:

#### Ferramenta 1: Pochete 2.0 — Processamento de Video

Sistema desenvolvido internamente para **cortar e segmentar videos grandes** de investigacao, permitindo o envio fragmentado ao Ministerio Publico e ao Poder Judiciario. Antes, videos de horas precisavam ser enviados inteiros, com tamanhos que inviabilizavam o envio eletronico. O Pochete 2.0 resolve isso automaticamente, economizando **horas de trabalho manual** por semana.

#### Ferramenta 2: Extrator de Exames de Direcao

Sistema de **extracao automatica de campos** de centenas de folhas de exames de direcao (laudos do DETRAN), consolidando os dados relevantes diretamente em arquivo DOC. O que antes consumia **horas semanais** de trabalho repetitivo de um investigador — copiar dados campo a campo de centenas de paginas — agora e feito em minutos. **O investigador e liberado para investigar**, que e sua funcao-fim.

#### Ferramenta 3: Tira-Voz (852) — Canal de Inteligencia Institucional

Plataforma completa de **inteligencia institucional anonima** para policiais civis de todo o estado de Minas Gerais, em operacao em [852.egos.ia.br](https://852.egos.ia.br). Funcionalidades:

| Capacidade | Descricao |
|---|---|
| **Chat com IA** | Conversa estruturada com modelo de linguagem (Qwen-plus/DashScope), que organiza relatos e cruza padroes |
| **Forum anonimo** | Topicos com votacao, comentarios e categorizacao, sem identificacao de quem postou |
| **Relatorios de inteligencia automaticos** | A cada 5 relatos, a IA gera um relatorio consolidando padroes, areas criticas e recomendacoes |
| **Biblioteca Juridica** | 27+ leis, sumulas e normativas relevantes para o policial civil, com links oficiais |
| **Validacao etica (ATRiAN)** | Camada de verdade que impede a IA de inventar dados, prometer acoes ou expor informacoes pessoais |
| **Filtro de PII** | Deteccao automatica de CPF, RG, MASP, REDS, placas e nomes antes de qualquer publicacao |
| **Exportacao** | PDF, DOCX, Markdown e compartilhamento via WhatsApp |
| **Gamificacao** | Sistema de pontos e rankings para engajamento (Recruta a Comissario) |
| **Identidade anonima** | Codinomes policiais aleatorios (ex: Falcao Noturno) com validacao de IA contra nomes reais |
| **Codigo aberto** | 100% do codigo publicado no GitHub para auditoria publica |
| **Telemetria** | Microsoft Clarity + Supabase + logs estruturados para acompanhamento de uso |

**Stack tecnica:** Next.js 16, React, TypeScript, TailwindCSS, Supabase (PostgreSQL), Alibaba Qwen (DashScope), Google Gemini (OpenRouter), Docker, Caddy, VPS Contabo.

**Codigo-fonte:** [github.com/enioxt/852](https://github.com/enioxt/852)

---

## 2. OBJETIVOS DO NUCLEO

### 2.1 Objetivos Imediatos (0-6 meses)

1. **Formalizar o NDIA** como unidade tecnica vinculada a Delegacia Regional de Patos de Minas
2. **Adquirir equipamentos** para processamento local de IA e dados
3. **Estabelecer infraestrutura fisica** adequada (espaco, rede, energia)
4. **Expandir o Tira-Voz (852)** com upload de documentos, transcricao de audio e integracao com LGPD
5. **Desenvolver novas ferramentas** de automacao documental (OCR, extracao de dados, geracao de relatorios)

### 2.2 Objetivos de Medio Prazo (6-18 meses)

1. **Treinar modelos de LLM locais** especializados em legislacao policial, fluxos de inquerito e linguagem do dia a dia das delegacias
2. **Oferecer capacitacao** em IA para policiais de todo o estado (presencial e remoto)
3. **Integrar com sistemas existentes** (REDS, PCNet, SINESP) onde houver permissao
4. **Criar banco de conhecimento** com jurisprudencia, doutrinas e fluxos operacionais
5. **Publicar resultados** em conferencias e periodicos de seguranca publica

### 2.3 Objetivos de Longo Prazo (18-36 meses)

1. **Replicar o modelo** em outras regionais da PCMG
2. **Estabelecer parcerias** com universidades (UFU, UFMG, PUC Minas, UNIPAM) e centros de pesquisa
3. **Contribuir com o ecossistema nacional** de IA em seguranca publica
4. **Tornar Patos de Minas referencia** em inovacao policial no Brasil

### 2.4 Governanca e Salvaguardas Minimas

Para que o NDIA opere com seguranca institucional e legitimidade, recomenda-se adotar desde o inicio:

- **Supervisao humana obrigatoria:** Nenhuma decisao que restrinja direitos deve ser tomada exclusivamente por IA
- **Ambientes separados:** Distincao clara entre teste, homologacao e producao
- **Trilha de auditoria:** Logs, versionamento, registro de acessos e governanca de alteracoes
- **Protecao de dados:** Uso prioritario de modelos locais, filtros de PII, ATRiAN e minimizacao de envio de dados a terceiros
- **Articulacao institucional:** Ponto focal com inteligencia, TI e controle interno para priorizacao e acompanhamento dos projetos

---

## 3. EQUIPAMENTOS E CUSTOS

### 3.1 Estacao de Trabalho para IA Local (LLM e Treinamento)

**Finalidade:** Rodar modelos de linguagem (LLM) localmente com privacidade total, treinar modelos especializados, processar grandes volumes de texto, realizar inferencia em tempo real sem depender de servicos em nuvem.

**Por que e necessario:** Dados de investigacao policial sao **sigilosos por natureza** (Lei 12.527/2011, LC 129/2013 Art. 84). Enviar conteudo sensivel para APIs de terceiros (OpenAI, Google, etc.) representa risco juridico e operacional. Modelos locais eliminam esse risco.

| Componente | Especificacao | Justificativa |
|---|---|---|
| **GPU** | 2x NVIDIA RTX 5090 (32GB GDDR7 cada, 64GB total) | Rodar modelos de 70B parametros quantizados (Llama 3, Qwen 2.5, DeepSeek). Dual RTX 5090 entrega performance equivalente a uma H100 por 25% do custo (Introl, 2025) |
| **CPU** | AMD Ryzen 9 9950X ou Intel i9-14900K | 16+ cores para pre-processamento de dados e pipelines paralelas |
| **RAM** | 128GB DDR5 | Carregamento de datasets, buffers de inferencia, multitarefa |
| **SSD** | 2TB NVMe PCIe 5.0 (sistema) + 4TB NVMe (dados) | Leitura rapida de modelos (30-70GB cada), armazenamento de datasets |
| **Fonte** | 1600W 80 Plus Titanium | Alimentar 2x GPUs de 575W com margem de seguranca |
| **Gabinete** | Full Tower com refrigeracao adequada | Dissipar ~1200W de calor em carga total |
| **Estimativa** | **R$ 70.000 a R$ 95.000** | |

**Capacidades dessa maquina:**
- Rodar Llama 3.1 70B, Qwen 2.5 72B, DeepSeek-V3 em quantizacao de 4-bit
- Fine-tuning (ajuste fino) de modelos de 7B-13B em datasets especializados
- Processar milhares de documentos por hora com OCR + NLP
- Servir multiplos usuarios simultaneamente via API local (Ollama, vLLM, llama.cpp)

### 3.2 Estacao de Processamento de Dados

**Finalidade:** Processamento de documentos, OCR, conversao de formatos, analise de dados estruturados, desenvolvimento de software, banco de dados local.

| Componente | Especificacao | Justificativa |
|---|---|---|
| **CPU** | AMD Ryzen 7 7800X3D ou equivalente | Excelente single-thread para compilacao e processamento |
| **RAM** | 64GB DDR5 | Manipulacao de grandes planilhas, PDFs, bancos de dados |
| **GPU** | NVIDIA RTX 4060 Ti (16GB) | Aceleracao leve de IA, suporte a CUDA para ferramentas de NLP |
| **SSD** | 1TB NVMe (sistema) + 2TB NVMe (dados) | Armazenamento de projetos e backups |
| **Estimativa** | **R$ 15.000 a R$ 25.000** | |

**Capacidades:**
- Processar centenas de PDFs com OCR (Tesseract, PaddleOCR)
- Rodar modelos menores (7B) para tarefas de classificacao e extracao
- Ambiente de desenvolvimento completo (IDEs, Docker, Git)
- Banco de dados local para prototipagem

### 3.3 MacBook Pro para Trabalho de Campo e Inteligencia

**Finalidade:** Equipamento portatil para trabalho de inteligencia em deslocamento, apresentacoes, desenvolvimento remoto, execucao de modelos de IA em campo.

| Especificacao | Detalhes |
|---|---|
| **Modelo** | MacBook Pro 16" com Apple M5 Max |
| **Memoria** | 64GB ou 128GB de memoria unificada |
| **Armazenamento** | 1TB ou 2TB SSD |
| **Justificativa** | O M5 Max com 128GB de memoria unificada e **a unica maquina portatil no mundo capaz de rodar modelos LLM de 80B parametros localmente** (Mac-DVD, 2026). A arquitetura Apple Silicon permite que GPU e CPU acessem a mesma memoria, viabilizando inferencia de modelos que em outras plataformas exigiriam GPUs dedicadas de R$ 150.000+. Ideal para trabalhos de inteligencia em campo, apresentacoes para gestores e desenvolvimento remoto |
| **Estimativa** | **R$ 30.000 a R$ 45.000** (dependendo da configuracao) |

**Referencia:** O MacBook Pro M5 Max e o equipamento padrao de desenvolvedores de IA nas maiores empresas de tecnologia do mundo (Apple, Google, Meta, OpenAI). A escolha nao e preferencia pessoal — e necessidade tecnica para rodar modelos localmente em mobilidade.

### 3.4 Raspberry Pi 5 (2 unidades) — Agentes Autonomos 24/7

**Finalidade:** Manter agentes de software rodando 24 horas por dia, 7 dias por semana, com custo energetico minimo.

| Especificacao | Detalhes |
|---|---|
| **Modelo** | Raspberry Pi 5 (8GB RAM) + AI HAT+ 2 (40 TOPS) |
| **Quantidade** | 2 unidades |
| **Custo unitario** | ~R$ 800 (Pi 5 + case + fonte + SD + AI HAT) |
| **Estimativa total** | **R$ 1.600 a R$ 2.000** |

**Uso 1 — Agente de Monitoramento:**
- Monitorar fontes de dados publicas relevantes para a inteligencia
- Executar rotinas de manutencao automatizada
- Servir como no de comunicacao segura entre dispositivos do nucleo
- Rodar modelos leves (TinyLlama 1.1B, Qwen 1.5B) para triagem automatica

**Uso 2 — Agente de Backup e Disponibilidade:**
- Manter copias incrementais de seguranca
- Servir como servidor DNS/VPN local
- Executar health checks dos sistemas em producao
- Custo energetico: ~5W por unidade (vs ~500W de um desktop)

**Justificativa:** Um Raspberry Pi 5 consome cerca de **R$ 3/mes de energia** e funciona 24/7 sem intervencao. E a forma mais economica e eficiente de manter agentes autonomos operando continuamente.

### 3.5 Infraestrutura de Apoio, Ergonomia e Operacao Diaria

A produtividade do nucleo tambem depende de itens de uso continuo para jornadas longas de desenvolvimento, reunioes, gravacao, transcricao e analise de audio e video.

| Item | Quantidade sugerida | Estimativa |
|---|---|---|
| Cadeiras ergonomicas de boa qualidade | 3 | R$ 4.500 a R$ 7.500 |
| Headphones fechados de boa qualidade (~R$ 400 cada) | 3 | R$ 1.200 |
| Microfone USB de boa qualidade | 1 | R$ 500 a R$ 1.200 |
| Kits sem fio de mouse + teclado | 3 | R$ 900 a R$ 1.800 |
| Monitores, no-break, cabos, hubs e suportes | - | R$ 2.900 a R$ 4.500 |
| **TOTAL INFRAESTRUTURA DE APOIO** | | **R$ 10.000 a R$ 16.200** |

### 3.6 Resumo de Custos — Equipamentos

| Item | Estimativa Minima | Estimativa Maxima |
|---|---|---|
| Estacao IA (2x RTX 5090, 128GB) | R$ 70.000 | R$ 95.000 |
| Estacao Processamento de Dados | R$ 15.000 | R$ 25.000 |
| MacBook Pro M5 Max (64-128GB) | R$ 30.000 | R$ 45.000 |
| 2x Raspberry Pi 5 + acessorios | R$ 1.600 | R$ 2.000 |
| Infraestrutura de apoio, audio, ergonomia e no-break | R$ 10.000 | R$ 16.200 |
| **TOTAL EQUIPAMENTOS** | **R$ 126.600** | **R$ 183.200** |

---

## 4. SERVICOS DE NUVEM E ASSINATURAS

Para manter o nucleo em operacao continua e com capacidade real de entrega, sao necessarios custos recorrentes de software, nuvem e produtividade.

Esses custos cumprem duas funcoes permanentes:

1. **Manter a operacao em producao**, com disponibilidade, banco de dados, dominio, logs, backup e fallback entre provedores
2. **Acelerar desenvolvimento, manutencao e pesquisa aplicada**, reduzindo o tempo entre ideia, prototipo, validacao e deploy

| Servico | Custo Mensal (USD) | Custo Mensal (BRL*) | Papel operacional |
|---|---|---|---|
| **Claude Max 20x** (Anthropic) | $200 | ~R$ 1.200 | Assinatura de alta intensidade para Claude Code, sessoes longas de arquitetura, refatoracao, testes, documentacao e manutencao de repositorios grandes. A Anthropic posiciona o plano Max para usuarios frequentes e diarios, com acesso ao Claude Code em uma mesma assinatura |
| **ChatGPT / Codex** (complementar) | $20 | ~R$ 120 | Apoio complementar para brainstorming, comparacao de saidas, revisao cruzada e prototipagem rapida |
| **VPS (Contabo/DigitalOcean)** | $50-100 | ~R$ 300-600 | Servidor virtual privado 24/7 para hospedar sistemas em producao com sistema operacional, CPU, memoria, disco, rede, HTTPS, logs, backup e monitoramento |
| **Supabase Pro** | $25 | ~R$ 150 | Banco de dados PostgreSQL gerenciado, autenticacao, storage e edge functions para aplicacoes em producao |
| **DashScope (Alibaba)** | $20-50 | ~R$ 120-300 | API do Qwen, modelo primario do Tira-Voz, com boa relacao custo-beneficio |
| **OpenRouter** | $10-30 | ~R$ 60-180 | Gateway para modelos alternativos (Gemini, Llama, Mistral), resiliencia e fallback |
| **Dominio + DNS** | $5 | ~R$ 30 | Endereco institucional, DNS e SSL |
| **GitHub Pro** | $4 | ~R$ 25 | Repositorios, CI/CD, Actions e trilha de auditoria tecnica |
| **TOTAL MENSAL SOFTWARE/NUVEM** | **$334-434** | **~R$ 2.000-2.600** | Base tecnica recorrente do nucleo |
| **TOTAL ANUAL SOFTWARE/NUVEM** | - | **~R$ 24.000-31.200** | Sem energia e internet dedicadas |

*Conversao estimada: 1 USD = 6,00 BRL*

### 4.1 O que sao esses gastos fixos mensais

Na pratica, ha duas camadas de gasto recorrente:

- **Base operacional minima:** VPS, Supabase, DashScope, OpenRouter, dominio e GitHub. Sem isso, o sistema nao fica no ar com estabilidade, historico, seguranca, observabilidade e rota de fallback.
- **Camada de produtividade e P&D:** Claude Max e ferramenta complementar de IA. Sem isso, o nucleo ainda opera, mas desenvolve, testa, documenta e itera mais lentamente.

Em resumo: os custos fixos nao sao luxo. Eles compram disponibilidade, continuidade operacional e velocidade de entrega.

### 4.2 Por que uma assinatura como Claude Max ajuda

Essa assinatura nao serve apenas para "ter mais um chatbot". Ela serve para dar continuidade a sessoes longas de desenvolvimento, auditoria de codigo, leitura de repositorios inteiros e trabalho agentico no terminal.

Segundo a Anthropic, o plano Max e voltado a **usuarios frequentes e diarios** e inclui acesso ao **Claude Code**. Isso importa porque desenvolvimento de software com IA deixou de ser apenas conversa pontual e passou a envolver refatoracoes multi-arquivo, geracao de testes, documentacao tecnica e manutencao de contexto por longos periodos.

Simon Willison, uma das vozes mais respeitadas em IA aplicada a programacao, sustenta que LLMs **amplificam a expertise existente** e que sua maior vantagem pratica e a **velocidade de desenvolvimento**, desde que haja supervisao humana. Andrej Karpathy, ex-OpenAI e ex-Tesla, relatou recentemente a mudanca de um fluxo majoritariamente manual para um fluxo majoritariamente agentico, no qual se "programa em ingles" e se revisa com criterio humano.

Para um nucleo pequeno, isso significa fazer mais com menos gente: escrever parsers, revisar codigo, estruturar APIs, gerar testes, documentar processos e reduzir o tempo entre problema, prototipo e deploy.

### 4.3 O que e VPS e em que ele ajuda

A sigla **VPS** significa **Virtual Private Server**. Em termos simples, e um servidor virtualizado que se comporta como um servidor dedicado, com sistema operacional proprio e recursos reservados ao projeto. Em provedores como DigitalOcean, um VPS equivale a uma maquina virtual pronta para hospedar aplicacoes reais na internet.

No contexto do NDIA, a VPS ajuda a:

1. Manter sistemas como o Tira-Voz disponiveis 24 horas por dia
2. Publicar APIs e paginas web com dominio oficial, HTTPS e controle de versao
3. Concentrar logs, backup, monitoramento e rotinas de atualizacao
4. Separar o ambiente institucional de producao do notebook pessoal do desenvolvedor
5. Viabilizar pilotos reais com usuarios de varias unidades, sem depender de maquina local ligada

Sem VPS, o projeto fica restrito a demonstracoes locais e perde continuidade institucional.

**Nota:** Esses valores sao **fracoes** do que custaria contratar desenvolvedores adicionais ou terceirizar o mesmo servico. Um unico desenvolvedor pleno no mercado privado custa R$ 12.000-20.000/mes em salario + encargos.

---

## 5. INFRAESTRUTURA FISICA

### 5.1 Requisitos Minimos

| Requisito | Especificacao |
|---|---|
| **Espaco** | Sala de 20-40m2, climatizada, com controle de acesso |
| **Rede** | Internet dedicada de 200+ Mbps (idealmente fibra empresarial) |
| **Energia** | Circuito dedicado de 20A (220V) para equipamentos de alta potencia |
| **No-break** | UPS de 3000VA para protecao contra quedas de energia |
| **Refrigeracao** | Ar-condicionado de 12.000-18.000 BTU (equipamentos geram calor significativo) |
| **Seguranca** | Porta com tranca eletronica, CFTV, controle de acesso restrito |
| **Mobiliario** | Mesas com passagem de cabos, cadeiras ergonomicas, rack de rede |

### 5.2 Opcoes de Local

**Opcao A — Reforma do 4o andar da Delegacia Regional de Patos de Minas**

O quarto andar do predio da Delegacia Regional atualmente abriga o setor de Inteligencia da Policia Civil. A reforma deste espaco para acomodar o NDIA teria as seguintes vantagens:

- Proximidade fisica com o setor de inteligencia (sinergia operacional)
- Estrutura predial ja existente (economia em construcao)
- Seguranca fisica do predio ja estabelecida
- Controle de acesso institucional

**Estimativa de reforma:** R$ 15.000 a R$ 30.000 (climatizacao, rede eletrica dedicada, cabeamento de rede, mobiliario)

**Opcao B — Locacao de Espaco Externo**

Em caso de inviabilidade da reforma, um espaco comercial proximo a delegacia com:

- Sala comercial de 30-50m2
- Infraestrutura de rede ja instalada
- Aluguel estimado: R$ 2.000-4.000/mes

**Recomendacao:** A Opcao A e preferivel por custo, seguranca e integracao operacional.

---

## 6. FERRAMENTAS E TECNOLOGIAS

### 6.1 Stack de Desenvolvimento

| Categoria | Tecnologias | Uso |
|---|---|---|
| **Linguagens** | TypeScript, Python, SQL | Desenvolvimento web, IA, dados |
| **Frameworks** | Next.js, React, TailwindCSS, FastAPI | Interfaces e APIs |
| **IA Local** | Ollama, vLLM, llama.cpp, Hugging Face | Execucao de modelos locais |
| **IA em Nuvem** | DashScope (Qwen), OpenRouter, OpenAI | Modelos de ponta via API |
| **Banco de Dados** | PostgreSQL (Supabase), SQLite | Persistencia e analytics |
| **DevOps** | Docker, Git, GitHub Actions, Caddy | Deploy e CI/CD |
| **OCR/NLP** | Tesseract, PaddleOCR, spaCy, LangChain | Processamento de documentos |
| **Seguranca** | ATRiAN (validacao etica), PII Scanner, LGPD | Protecao de dados |

### 6.2 OpenClaw — Agentes Autonomos de Codigo Aberto

O **OpenClaw** e um assistente de IA autonomo de codigo aberto que roda **localmente**, sem enviar dados para servidores externos. Isso e critico para uso policial, onde a confidencialidade e mandatoria (LC 129/2013 Art. 84, Lei 12.527/2011).

**Aplicacoes no contexto policial:**

- Triagem automatica de documentos e emails institucionais
- Gerenciamento de prazos processuais (flagrante, inquerito, cautelares)
- Rascunho de pecas procedimentais (portarias, relatorios, oficios)
- Organizacao de base de conhecimento juridico local
- Custo operacional: **R$ 150-500/mes** (energia + servidor local)

### 6.3 Modelos de Linguagem Locais

Com a estacao de IA proposta, o nucleo podera executar localmente:

| Modelo | Parametros | Uso | Privacidade |
|---|---|---|---|
| **Llama 3.1** (Meta) | 70B | Chat, resumos, analise de texto | 100% local |
| **Qwen 2.5** (Alibaba) | 72B | Multilinguagem, codigo, raciocinio | 100% local |
| **DeepSeek-V3** | 685B (MoE) | Raciocinio complexo, analise juridica | 100% local |
| **CodeLlama** | 34B | Geracao e revisao de codigo | 100% local |
| **Mistral Large** | 123B | Multilinguagem europeu, legal | 100% local |

**Vantagem critica:** Dados de investigacao **nunca saem da maquina**. Nenhuma empresa terceira tem acesso. Conformidade total com LGPD e sigilo investigativo.

---

## 7. GANHOS ESPERADOS

### 7.1 Desoneramento de Servidores

| Tarefa Atual | Tempo Atual | Com Automacao | Economia |
|---|---|---|---|
| Extracao de dados de exames de direcao | 4-6h/semana | 15 min/semana | **~95%** |
| Corte e envio de videos para MP/Justica | 2-3h/video | 10 min/video | **~90%** |
| Digitacao de relatorios de inteligencia | 3-5h/relatorio | 30 min (IA gera rascunho) | **~85%** |
| Pesquisa de legislacao para subsidiar inquerito | 1-2h/consulta | Instantaneo (Biblioteca + IA) | **~95%** |
| Consolidacao de relatos para pauta coletiva | Manual, nao era feito | Automatico (Tira-Voz) | **Novo** |

**Resultado:** Centenas de horas-homem liberadas por ano para a **atividade-fim: investigacao.**

### 7.2 Ganhos Institucionais

- **Pioneirismo:** Primeiro nucleo de IA em Policia Civil estadual do Brasil
- **Ganho politico:** Visibilidade para MG como estado inovador em seguranca publica
- **Ganho social:** Ferramentas que melhoram o atendimento ao cidadao e a celeridade investigativa
- **Ganho de recursos humanos:** Servidores fazendo trabalho qualificado em vez de repetitivo
- **Ganho cultural:** Modernizacao da cultura institucional, atracao de talentos
- **Ganho de inteligencia:** Capacidade de analise de padroes que seria impossivel manualmente
- **Escalabilidade:** O modelo pode ser replicado para todas as 850+ delegacias de MG

### 7.3 Indicadores Sugeridos de Acompanhamento

- **Horas-homem economizadas** em OCR, digitacao, corte de video e consolidacao de dados
- **Quantidade de relatorios** produzidos com apoio de IA ou automacao
- **Tempo medio de resposta** em fluxos que passem a usar ferramentas do nucleo
- **Numero de policiais capacitados** em IA e automacao por semestre
- **Numero de unidades atendidas** por solucoes desenvolvidas em Patos de Minas

### 7.4 Disponibilidade para o Estado

O NDIA se coloca **a disposicao de todo o estado de Minas Gerais** para:

1. **Treinamentos** em IA aplicada a seguranca publica para policiais de qualquer regional
2. **Desenvolvimento de sistemas** sob demanda para setores da PCMG
3. **Manutencao e suporte** de ferramentas ja implantadas
4. **Consultoria tecnica** para projetos de modernizacao em outras regionais
5. **Formacao de multiplicadores** que levem o conhecimento para suas unidades

O plano e que **o conhecimento desenvolvido em Patos de Minas se espalhe por todo o estado**, criando uma rede de inovacao dentro da Policia Civil de Minas Gerais.

---

## 8. COMPARATIVO DE INVESTIMENTO

| Alternativa | Custo Estimado | Resultado |
|---|---|---|
| Contratar empresa terceirizada de TI | R$ 30.000-80.000/mes | Dependencia externa, sem transferencia de conhecimento |
| Contratar 3 desenvolvedores CLT | R$ 50.000-80.000/mes (salarios + encargos) | Alto custo recorrente, rotatividade |
| Comprar software comercial de IA | R$ 100.000-500.000/ano (licencas) | Vendor lock-in, sem customizacao, dados em nuvem terceira |
| **NDIA (esta proposta)** | **R$ 140.000-215.000 (unico) + R$ 2.500-3.600/mes** | Autonomia total, codigo aberto, dados locais, conhecimento institucional |

**O investimento em equipamentos se paga em menos de 3 meses** comparado a alternativa de terceirizacao ou contratacao equivalente.

---

## 9. INVESTIMENTO CONSOLIDADO

### 9.1 Investimento Inicial (Unico)

| Categoria | Valor |
|---|---|
| Equipamentos (Secao 3) | R$ 126.600 — R$ 183.200 |
| Infraestrutura fisica — reforma (Secao 5) | R$ 15.000 — R$ 30.000 |
| **TOTAL INICIAL** | **R$ 141.600 — R$ 213.200** |

### 9.2 Custo Mensal Recorrente

| Categoria | Valor |
|---|---|
| Base operacional minima em software/nuvem (VPS, banco, modelos, dominio, GitHub) | R$ 685 — R$ 1.285 |
| Assinaturas de produtividade e desenvolvimento (Claude Max + apoio complementar) | R$ 1.320 |
| Energia eletrica (estimativa) | R$ 300 — R$ 500 |
| Internet dedicada (se necessario) | R$ 200 — R$ 500 |
| **TOTAL MENSAL** | **R$ 2.500 — R$ 3.600** |
| **TOTAL ANUAL RECORRENTE** | **R$ 30.000 — R$ 43.200** |

---

## 10. FONTES DE FINANCIAMENTO SUGERIDAS

1. **Fundo Nacional de Seguranca Publica (FNSP)** — Linha especifica para TIC, inteligencia e modernizacao em seguranca publica
2. **FNDCT/Finep** — Financiamento de inovacao tecnologica no setor publico, em linha com a agenda do PBIA e do INSPIRE
3. **Emendas parlamentares** — Deputados estaduais e federais de Minas Gerais
4. **Fundo Estadual de Seguranca Publica de MG** — Recursos proprios da PCMG
5. **Parcerias com universidades** (UNIPAM, UFU, UFMG) — Projetos de extensao e pesquisa
6. **ABDI** — Agencia Brasileira de Desenvolvimento Industrial (parceria similar a da PF)
7. **Orcamento proprio da Delegacia Regional** — Para itens de menor valor

---

## 11. CRONOGRAMA PROPOSTO

| Fase | Periodo | Acoes |
|---|---|---|
| **Fase 0** | Agora | Apresentacao da proposta a Chefia da PCMG e autoridades |
| **Fase 1** | Mes 1-2 | Aprovacao, captacao de recursos, licitacao/aquisicao de equipamentos |
| **Fase 2** | Mes 2-3 | Preparacao da infraestrutura fisica (reforma, rede, energia) |
| **Fase 3** | Mes 3-4 | Instalacao dos equipamentos, configuracao do ambiente |
| **Fase 4** | Mes 4-6 | Desenvolvimento das primeiras ferramentas, testes, documentacao |
| **Fase 5** | Mes 6-12 | Treinamento de modelos locais, capacitacao de policiais, publicacao de resultados |
| **Fase 6** | Mes 12-18 | Expansao do portfolio de ferramentas, inicio da replicacao em outras regionais |

---

## 12. CONCLUSAO

A criacao do Nucleo de Desenvolvimento e Inteligencia Artificial na Delegacia Regional de Patos de Minas nao e um projeto futurista — **e uma necessidade presente e uma oportunidade historica.**

O cenario nacional ja se movimenta rapidamente: a PM de Sao Paulo cria sua Fabrica de IA, Goias lanca o "IA Contra o Crime", o Rio expande cameras inteligentes, a PF firma acordos com a ABDI, e o Ministerio da Justica autoriza formalmente o uso de IA em investigacoes. **Quem nao agir agora ficara para tras.**

Patos de Minas ja demonstrou, com recursos minimos e iniciativa propria, que e possivel desenvolver ferramentas de alto impacto. O Pochete 2.0, o extrator de exames e o Tira-Voz sao provas concretas de viabilidade. O que falta e **infraestrutura, formalizacao e apoio institucional.**

Com um investimento inicial de **R$ 140.000 a R$ 215.000** — ainda compativel com projetos estruturantes de TIC e menor que diversas aquisicoes patrimoniais recorrentes da seguranca publica — a PCMG tera:

- O **primeiro nucleo de IA em Policia Civil estadual do Brasil**
- Capacidade de **rodar modelos de inteligencia artificial localmente**, com sigilo total
- Ferramentas que **liberam investigadores para investigar**
- Um **centro de excelencia** a disposicao de todo o estado
- **Codigo aberto e auditavel**, sem dependencia de fornecedores
- Um **ganho politico, social e institucional** sem precedentes

**A evolucao da Policia Civil de Minas Gerais — e das policias do Brasil — passa por aqui.**

---

## ANEXOS

### Anexo A — Referencias Tecnicas

1. Introl (2025). "Local LLM Hardware Guide: Dual RTX 5090s match H100 performance for 70B models at 25% cost"
2. Spheron (2025). "Best NVIDIA GPUs for LLMs: Complete Ranking Guide"
3. Apple Newsroom (2026). "MacBook Pro with M5 Pro and M5 Max — up to 4x AI performance"
4. Mac-DVD (2026). "M5 Max 128GB: Best Portable LLM Machine in 2026"
5. Raspberry Pi Foundation (2026). "AI HAT+ 2: 40 TOPS, LLM-capable add-on for Pi 5"
6. IntuitionLabs (2026). "Claude Max Plan: Pricing, Limits & Features"
7. KSRED (2026). "Claude Code Pricing Guide: 93% savings vs API pricing"
8. OpenClaw (2025-2026). "Open-source AI assistant that runs locally"
9. Anthropic (2026). "Plans & Pricing", "Max plan" e Help Center "What is the Max plan?"
10. Simon Willison (2025). "Here's how I use LLMs to help me write code"
11. Andrej Karpathy (2026). Notas publicas sobre AI coding agents e "agentic engineering"
12. DigitalOcean (2026). "Droplets" e "VPS Hosting"

### Anexo B — Referencias Institucionais

1. Governo Federal (2024). "Plano Brasileiro de Inteligencia Artificial 2024-2028 — R$ 23 bilhoes"
2. MGI/CPQD (2025). "Projeto INSPIRE — R$ 390 milhoes para IA no servico publico"
3. Ministerio da Justica (2025). "Portaria autorizando uso de IA em investigacoes criminais"
4. Senado Federal (2025). "PL para destinacao de 0,5% do FNSP para TIC"
5. PM-SP (2025). "Fabrica de Inteligencia Artificial para seguranca publica"
6. Governo de Goias (2026). "IA Contra o Crime — ferramenta para forcas policiais"
7. Prefeitura do Rio (2025). "CIVITAS/IRIS — 20.000 cameras inteligentes ate 2028"
8. Policia Federal + ABDI (2025). "Projeto MITRA Nacional — IA/IoT para fronteiras"
9. PC de Roraima (2025). "R$ 3,5 milhoes investidos em TI — 400+ computadores"
10. PC de Santa Catarina (2025). "Inquerito Policial Digital"

### Anexo C — Tira-Voz (852) — Codigo Fonte

- **Repositorio:** [github.com/enioxt/852](https://github.com/enioxt/852)
- **URL em producao:** [852.egos.ia.br](https://852.egos.ia.br)
- **Licenca:** Codigo aberto
- **Documentacao tecnica completa:** `AGENTS.md` no repositorio

---

*Documento elaborado pelo setor de desenvolvimento da Delegacia Regional de Patos de Minas — PCMG*
*Marco de 2026*

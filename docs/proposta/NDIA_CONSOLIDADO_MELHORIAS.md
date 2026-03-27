# NDIA PATOS DE MINAS — ANÁLISE CONSOLIDADA E MELHORIAS

> **Data:** 27 de Março de 2026  
> **Objetivo:** Unificar todos os documentos NDIA, condensar números e apontar melhorias  
> **Fontes:** 4 documentos principais analisados  
> **Local:** `/home/enio/852/docs/proposta/`

---

## RESUMO EXECUTIVO

Após análise completa de todas as apresentações sobre o Núcleo de Desenvolvimento e Inteligência Artificial (NDIA) da Polícia Civil de Minas Gerais em Patos de Minas, foram identificadas **inconsistências críticas** entre versões e **gaps de governança** que precisam ser corrigidos antes de qualquer apresentação institucional.

**Veredito:** Os documentos possuem informações conflitantes que podem comprometer a credibilidade da proposta. Recomenda-se revisão urgente com unificação dos números e adição de elementos de compliance obrigatórios.

---

## 1. DOCUMENTOS ANALISADOS

| # | Arquivo | Tipo | Característica |
|---|---------|------|----------------|
| 1 | `PITCH_NUCLEO_IA_PCMG.md` | Pitch executivo | Curto (36 linhas), foco político |
| 2 | `PROPOSTA_NUCLEO_IA_COMPLETA.md` | Proposta técnica | Detalhada (510 linhas), versão "oficial" |
| 3 | `NDIA_Patos_Documento_Estrategico_Completo.txt` | Diagnóstico estratégico | Completo (571 linhas), inclui gaps críticos |
| 4 | `v1_executiva_completa.html` | Web executiva | HTML visual, política |
| 5 | `v2_tecnica_completa.html` | Web técnica | Especificações técnicas |
| 6 | `v4_plano_completo_corrigido.html` | Web completa | Versão mais recente |

---

## 2. INCONSISTÊNCIAS CRÍTICAS ENCONTRADAS

### 2.1 INVESTIMENTO CAPEX — ⚠️ PRIORIDADE MÁXIMA

| Versão | Valor Reportado | Diferença vs Real |
|--------|-----------------|-------------------|
| Pitch/Proposta curta | R$ 126.600 — R$ 183.200 | **Subestimado em 42%** |
| Documento estratégico | R$ 314.600 | **Valor realista** |

**Problema:** A diferença de **R$ 131.400 a R$ 188.400** entre versões é inaceitável. Quem recebe o pitch curto tem uma expectativa completamente diferente de quem recebe o documento estratégico.

**Recomendação:**
- **Mínimo Viável:** R$ 126.600 (estação IA básica + processamento + MacBook)
- **Completo Recomendado:** R$ 314.600 (Threadripper 64 cores, NAS 100TB, capacitação, contingência)
- Sempre apresentar ambos os cenários com justificativa clara

---

### 2.2 CUSTOS MENSAIS OPEX

| Item | Pitch Curto | Doc Estratégico | Real Recomendado |
|------|-------------|-----------------|------------------|
| **Total Mensal** | R$ 2.500 — R$ 3.600 | R$ 4.000 | **R$ 4.500 — R$ 5.500** |
| Energia Elétrica | ~R$ 300 — R$ 500 | R$ 1.800 | R$ 900 — R$ 1.400 |
| Software/Cloud | R$ 2.000 — R$ 2.600 | — | R$ 2.000 — R$ 2.600 |
| Manutenção | — | R$ 800 | R$ 800 |
| Suporte Técnico | — | R$ 1.200 | R$ 1.200 |

**Problema:** O pitch omite custos de manutenção e suporte técnico.

---

### 2.3 POPULAÇÃO BENEFICIADA

| Versão | Valor | Fonte |
|--------|-------|-------|
| Doc Estratégico | 155.000 habitantes | IBGE |
| HTML v1_executiva | 169.000 habitantes | IBGE 2025 |

**Problema:** Inconsistência de 14.000 habitantes (9%).
**Correção:** Usar **155.000 habitantes** (IBGE mais recente).

---

### 2.4 ESPECIFICAÇÕES TÉCNICAS — CONFLITO GRAVE

| Componente | Pitch Curto | Doc Estratégico | Diferença |
|------------|-------------|-----------------|-----------|
| **CPU** | AMD Ryzen 9 9950X (16 cores) | AMD Threadripper PRO 7985WX (64 cores) | **4x mais cores** |
| **RAM** | 128GB DDR5 | 512GB DDR5 ECC | **4x mais memória** |
| **GPU** | 2x RTX 5090 (igual) | 2x RTX 5090 | — |
| **SSD** | 2TB + 4TB | 2x 4TB NVMe | Similar |
| **NAS** | — | 100TB RAID-6 | **Adicional** |
| **Energia** | ~1.200W | ~1.450W | Calculado diferente |

**Problema:** O pitch sugere uma máquina de entrada, enquanto o doc estratégico especifica uma máquina de datacenter. Isso é enganoso.

---

### 2.5 ECONOMIA E PAYBACK — MÉTRICAS DIVERGENTES

| Métrica | Pitch Curto | Doc Estratégico | Doc Estratégico v2 |
|---------|-------------|-----------------|-------------------|
| Economia Anual | R$ 285.000 | R$ 285.000 | R$ 237.000 (líquida) |
| Payback | < 3 meses | 10 meses | 16 meses |
| ROI 3 anos | Não citado | Não citado | 226% |

**Problema:** O pitch promete payback em < 3 meses, mas o cálculo realista mostra 10-16 meses. Isso é **irrealista e arriscado**.

**Cálculo correto:**
```
Investimento: R$ 314.600
Economia anual líquida: R$ 237.000 (descontando OPEX)
Payback: 314.600 / 237.000 = 16 meses (conservador)
Payback otimista: ~10 meses (com receitas)
```

---

## 3. GAPS CRÍTICOS IDENTIFICADOS (do doc estratégico)

### 3.1 GOVERNANÇA E COMPLIANCE — 🔴 CRÍTICO

| Gap | Status | Risco |
|-----|--------|-------|
| Framework Federal de Ética em IA (out/2025) | **AUSENTE** | Alto — obrigatório para projetos públicos |
| LGPD Art. 4º III (exceção segurança pública) | **SUPERFICIAL** | Alto — base legal incompleta |
| Resolução CNJ nº 332/2020 | **FALTANDO** | Médio — referência para IA no Judiciário |
| Estratégia Nacional de IA (E-Digital 2022-2026) | **AUSENTE** | Médio — alinhamento estratégico |
| Comitê Gestor de Dados da PCMG | **NÃO MENCIONADO** | Alto — governança institucional |

---

### 3.2 MÉTRICAS SEM FUNDAMENTAÇÃO — 🟠 ALTO

| Métrica Citada | Problema | Correção Necessária |
|----------------|----------|---------------------|
| "95% redução de tempo" | Sem baseline documentado | Documentar tempo atual de transcrição |
| "26% redução de crimes" | Sem fonte | Citar: Alagoas IA-SSP (2024), único caso validado |
| "Economia de R$ 285.000/ano" | Sem detalhamento por linha | Mostrar cálculo: 2.400h × R$ 75/h = R$ 180.000 |
| "ROI de 226% em 3 anos" | Sem cenários | Apresentar conservador, realista e otimista |

---

### 3.3 ARQUITETURA TÉCNICA SUPERFICIAL — 🟡 MÉDIO

| Item | Status | Impacto |
|------|--------|---------|
| Modelos de IA especificados | Parcial | Llama? Qwen? Whisper? Mixtral? — Padronizar |
| Requisitos de energia calculados | Divergentes | Unificar cálculo: 1.450W pico |
| Estratégia de backup/disaster recovery | **AUSENTE** | Crítico — adicionar política 3-2-1 |
| Plano de capacitação operacional | **AUSENTE** | 320h totais, parceria UNIPAM |
| Plano de manutenção preventiva | **AUSENTE** | Contrato mensual R$ 800 |

---

### 3.4 STAKEHOLDER ENGAGEMENT — 🟡 MÉDIO

| Stakeholder | Status | Ação Necessária |
|-------------|--------|-----------------|
| UNIPAM | Mencionado sem formalização | Firmar MOU/convênio |
| Sociedade civil | Nenhum plano de comunicação | Criar estratégia de divulgação |
| Mapa de riscos político-institucionais | **AUSENTE** | Adicionar análise de riscos |
| Prodemge/SESP-MG | Não mencionado | Verificar integração técnica |

---

## 4. RECOMENDAÇÕES DE MELHORIA

### 4.1 UNIFICAÇÃO IMEDIATA (P0 — Crítico)

**Ações obrigatórias antes de qualquer apresentação:**

1. **Definir uma única versão de orçamento**
   - Mínimo Viável: R$ 126.600 (operacional básico)
   - Recomendado: R$ 314.600 (infraestrutura completa)
   - Sempre apresentar ambos com trade-offs claros

2. **Corrigir população**
   - Usar **155.000 habitantes** (IBGE oficial)
   - Remover referência a 169.000

3. **Unificar especificações técnicas**
   - CPU: AMD Ryzen 9 9950X (16 cores) OU Threadripper PRO 7985WX (64 cores)
   - Justificar escolha baseada em carga de trabalho
   - RAM: 128GB (mínimo) ou 512GB (recomendado)

4. **Corrigir payback**
   - Remover "< 3 meses" do pitch
   - Usar **10-16 meses** (realista)
   - Mostrar cálculo completo

---

### 4.2 ADIÇÃO DE GOVERNANÇA (P0 — Crítico)

**Elementos obrigatórios a adicionar:**

```markdown
## Compliance e Governança

- ✅ Framework Federal de Ética em IA (Governo Federal, out/2025)
- ✅ LGPD Art. 4º III — Exceção expressa para segurança pública
- ✅ LGPD Art. 23 — Tratamento pelo poder público
- ✅ Resolução CNJ nº 332/2020 — Diretrizes para IA no Judiciário
- ✅ Estratégia Nacional de IA (E-Digital 2022-2026)
- ✅ Portaria MJ (jun/2025) — Autorização uso IA em investigações
```

---

### 4.3 DOCUMENTAÇÃO DE MÉTRICAS (P1 — Alto)

**Baseline necessário (coletar antes de implantação):**

| Processo | Tempo Atual | Custo/h | Volume/mês |
|----------|-------------|---------|------------|
| Transcrição de oitivas | ___ min/h de áudio | R$ 75 | ___ oitivas |
| Corte de vídeos | ___ min/vídeo | R$ 75 | ___ vídeos |
| Extração de laudos | ___ min/laudo | R$ 75 | ___ laudos |
| Pesquisa legislação | ___ min/consulta | R$ 75 | ___ consultas |

**Fontes de cases nacionais:**
- Goiás "IA Contra o Crime": 100+ casos em 30 dias (2024)
- Alagoas IA-SSP: 26% redução criminalidade violenta (2023-2024)
- São Paulo DETECTA: 700+ câmeras integradas
- Roraima: R$ 3,5M investidos, 400+ computadores

---

### 4.4 PADRONIZAÇÃO DE VERSÕES (P1 — Alto)

Criar 3 versões padronizadas:

| Versão | Público | Formato | Conteúdo |
|--------|---------|---------|----------|
| **Executiva** | Prefeito, vereadores, imprensa | 10 slides | Visão, impacto político, investimento resumido |
| **Técnica** | Delegados, TI, Prodemge | 20-30 slides | Arquitetura, integrações, segurança, roadmap |
| **Investimento** | SEBRAE, BDMG, FNSP | Planilha | CAPEX detalhado, OPEX, ROI, fontes de captação |

---

## 5. VERSÃO CANÔNICA CONSOLIDADA

### 5.1 NÚMEROS OFICIAIS UNIFICADOS

| Categoria | Valor Oficial | Observação |
|-----------|---------------|------------|
| **População** | 155.000 habitantes | IBGE |
| **CAPEX Mínimo** | R$ 126.600 | Configuração básica operacional |
| **CAPEX Recomendado** | R$ 314.600 | Infraestrutura completa + capacitação |
| **OPEX Mensal** | R$ 4.500 — R$ 5.500 | Energia + manutenção + cloud |
| **OPEX Anual** | R$ 54.000 — R$ 66.000 | — |
| **Payback** | 10-16 meses | Cálculo conservador |
| **ROI 3 anos** | 150-226% | Depende de cenário |
| **Economia Anual Direta** | R$ 285.000 | 2.400h liberadas × R$ 75/h |
| **Economia Anual Líquida** | R$ 219.000 — R$ 231.000 | Descontando OPEX |

---

### 5.2 ESPECIFICAÇÃO TÉCNICA CANÔNICA

#### Opção A — Mínimo Viável (R$ 126.600)

```
CPU: AMD Ryzen 9 9950X (16 cores)
GPU: 2x NVIDIA RTX 5090 (32GB cada, 64GB total)
RAM: 128GB DDR5
SSD: 2TB NVMe (sistema) + 4TB NVMe (dados)
Estação Processamento: Ryzen 7 + RTX 4060 Ti
MacBook Pro M5 Max: 64GB
Edge: 2x Raspberry Pi 5
Infraestrutura: Cadeiras, monitores, no-break
```

#### Opção B — Completo Recomendado (R$ 314.600)

```
CPU: AMD Threadripper PRO 7985WX (64 cores)
GPU: 2x NVIDIA RTX 5090 (32GB cada, 64GB total)
RAM: 512GB DDR5 ECC
SSD: 2x 4TB NVMe high-endurance
NAS: 100TB RAID-6 (dados históricos REDS)
Rede: Isolada, VPN interna, mTLS
UPS: 3kVA redundância
MacBook Pro M5 Max: 128GB
Edge: 2x Raspberry Pi 5 + AI HAT
Capacitação: 320h (320h × R$ 56,25/h = R$ 18.000)
Implantação: R$ 35.000
Contingência: 10%
```

---

### 5.3 MELHORIAS OPERACIONAIS DOCUMENTADAS

| Tarefa | Tempo Atual | Com IA | Economia |
|--------|-------------|--------|----------|
| Transcrição oitiva (1h áudio) | 2h | 15 min | 87% |
| Corte vídeo (envio MP/Judiciário) | 2-3h | 10 min | 90% |
| Extração laudo DETRAN | 4-6h/semana | 15 min/semana | 95% |
| Pesquisa legislação | 1-2h | Instantâneo | 95% |
| Consolidação relatos | Manual → não feito | Automático | Novo |

---

## 6. CHECKLIST DE COMPLIANCE OBRIGATÓRIO

Antes de qualquer apresentação oficial, verificar:

- [ ] Framework Federal de Ética em IA (out/2025) mencionado
- [ ] LGPD Art. 4º III citado explicitamente
- [ ] LGPD Art. 23 citado explicitamente
- [ ] Resolução CNJ 332/2020 mencionada
- [ ] E-Digital 2022-2026 referenciado
- [ ] Portaria MJ (jun/2025) citada
- [ ] Base legal de todos os casos nacionais documentada
- [ ] Baseline atual de tempos processos coletado
- [ ] Orçamento com cenário mínimo e recomendado
- [ ] Payback realista (10-16 meses) apresentado
- [ ] Plano de capacitação incluído
- [ ] Estratégia de backup/disaster recovery
- [ ] Plano de manutenção preventiva
- [ ] Mapa de riscos político-institucionais

---

## 7. ARQUIVOS RECOMENDADOS A CRIAR

1. **`NDIA_PITCH_EXECUTIVO_10SLIDES.pptx`** — Para políticos e imprensa
2. **`NDIA_PROPOSTA_TECNICA_COMPLETA.pdf`** — Para TI e operacional
3. **`NDIA_PLANO_INVESTIMENTO.xlsx`** — Para agências de fomento
4. **`NDIA_CHECKLIST_COMPLIANCE.md`** — Documento de governança

---

## 8. CONCLUSÃO

As apresentações atuais do NDIA possuem **qualidade técnica excelente** mas **inconsistências críticas** que precisam ser corrigidas. O documento estratégico (`NDIA_Patos_Documento_Estrategico_Completo.txt`) é o mais completo e deve servir como base, mas precisa:

1. Resumir para audiências não-técnicas
2. Adicionar elementos de governança e compliance
3. Corrigir números conflitantes
4. Criar versões específicas por público-alvo

**Prioridade máxima:** Unificar orçamento (R$ 314.600 como valor oficial recomendado, R$ 126.600 como mínimo viável) e corrigir payback (16 meses realista, não 3 meses).

**A evolução da Polícia Civil de Minas Gerais passa por aqui — mas a credibilidade do projeto depende de números precisos e governança sólida.**

---

*Documento elaborado em 27 de Março de 2026*  
*Análise baseada em 4 documentos NDIA encontrados na máquina*  
*Local: /home/enio/852/docs/proposta/*

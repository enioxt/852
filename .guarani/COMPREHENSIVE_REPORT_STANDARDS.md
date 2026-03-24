# Comprehensive Report Standards — 852

> **Version:** 2.0.0 | **Updated:** 2026-03-24

## Purpose

Define the canonical standard for comprehensive intelligence reports in 852.
These reports are open, collaborative, evidence-based, and continuously improvable.

## Non-Negotiable Principles

1. **Open document**: every report must say that more data improves quality.
2. **No PII**: never expose names, CPF, REDS, MASP, process numbers, phone, email, or other identifiers.
3. **Evidence first**: every major claim must cite observed evidence or mark itself clearly as an inference.
4. **Versioned output**: every report must include a version label and generation timestamp.
5. **Single final version**: only the validated report may remain visible publicly.
6. **Comparative memory**: each new report must explain what changed since the previous one.
7. **Methodology visible**: the reader must understand what data was used and how the synthesis happened.
8. **Actionable close**: every report must end with gaps, next steps, and what would improve the next version.

## Mandatory Report Sections

Every comprehensive report must include:

1. **Header and identity**
   - Title
   - Version
   - Generation timestamp
   - Open/collaborative badge
   - Dataset scope

2. **Methodology**
   - Data sources used
   - Data window
   - AI pipeline stages
   - Explicit limitations

3. **Executive summary**
   - 2-3 paragraphs
   - State of the platform
   - Main systemic findings

4. **Systemic patterns**
   - Recurring themes
   - Operational, structural, technological, and cultural patterns

5. **Critical areas**
   - What needs urgent attention
   - Ordered by severity and leverage

6. **Deep insights**
   - Card format
   - Category
   - Severity
   - Description
   - Evidence
   - Distinguish observation vs inference

7. **Emerging topics**
   - Topics starting to appear
   - What to monitor next

8. **External context**
   - Exa research summary
   - Benchmarks or practices from analogous systems
   - Applicability to 852

9. **Technical review**
   - Codex review summary
   - Structural or implementation improvements
   - Data/UX/engineering gaps

10. **What was missing**
    - Explicit lacunas in the current data
    - Fields or metrics still to be filled later
    - Why those gaps matter

11. **Recommendations**
    - Concrete actions
    - Prioritized
    - Written in operational language

12. **Raw reference data**
    - Aggregated counts
    - Category distribution
    - Data window

13. **Closing note**
    - Report is open and collaborative
    - More conversations will improve future iterations

## Multi-AI Pipeline (Mandatory)

### Stage 1: Deep Analysis
- Use the official 852 intelligence routing.
- Prefer the model returned by `getModelConfig('intelligence_report')`.
- Generate structured JSON first.
- Do not hardcode a provider/model in the report generator.

### Stage 2: Exa Context
- Use real external sources, not placeholders.
- Include at least 2 sources when available.
- Summarize only the parts relevant to anonymity, speak-up systems, and trust.

### Stage 3: Technical Review
- Run a Codex review pass or equivalent structured technical audit.
- Record architectural or data-quality improvements.
- Call out missing metrics and future automation opportunities.

### Stage 4: Final Synthesis
- Produce standalone HTML.
- Dark mode only.
- Responsive layout.
- No external CSS dependency.
- Must save to `ai_reports_852`.

## Data Extraction Rules

- **Conversations**: latest 100 by `created_at DESC`
- **Issues**: latest 100 by `created_at DESC`
- **Reports**: latest 50 excluding deleted
- **AI reports**: latest 20 for context
- **Telemetry**: latest 500 for quality signals
- Use aggregated views whenever possible.

## Output Format Rules

### Structured JSON keys
- `titulo`
- `versao`
- `resumo_executivo`
- `metodologia`
- `padroes_sistemicos`
- `areas_criticas`
- `insights`
- `topicos_emergentes`
- `contexto_externo`
- `revisao_tecnica`
- `lacunas`
- `recomendacoes`
- `metricas`

### HTML requirements
- Include version badge
- Include methodology section
- Include evidence blocks
- Include improvements/missing items section
- Include final open-document note

## Quality Gates

Before publishing:

- [ ] Old incomplete versions removed or hidden
- [ ] Only one final report visible publicly
- [ ] No PII or sensitive identifiers
- [ ] Methodology section present
- [ ] External context section present
- [ ] Technical review section present
- [ ] Missing items section present
- [ ] Recommendations are actionable
- [ ] HTML saved successfully in database
- [ ] Public URL resolves correctly

## Improvement Loop

Each new version must add at least one of:
- Better evidence coverage
- Better comparative context
- Better metrics
- Better missing-data tracking
- Better recommendations
- Better UX structure

## Governance

- Canonical source: `/home/enio/852/.guarani/COMPREHENSIVE_REPORT_STANDARDS.md`
- Generator must follow this file before publish
- Changes to this standard require review and a new report version

# AI Reports v2 — Design Document

> Tira-Voz Intelligence Reports — Enhanced Cross-Report Analysis

**Status:** Design Phase | **Target:** v2.0.0

---

## Objectives

Transformar relatórios de inteligência de sumarização sequencial para **análise comparativa com detecção de padrões**:

1. **Cross-report patterns**: "3 delegacias relataram falta de viatura"
2. **Trend detection**: "Aumento de 40% em relatos sobre efetivo"
3. **Semantic clustering**: Agrupar relatos similares por tema
4. **Rich HTML**: Visualizações, badges, métricas
5. **Recurrence tracking**: Detectar "mesmo problema, novo relato"

---

## Technical Architecture

### New Components

```
src/lib/ai-reports-v2/
├── pattern-detector.ts      # Detect cross-report patterns
├── trend-analyzer.ts        # Compare with previous periods
├── semantic-cluster.ts      # Group similar reports
├── recurrence-tracker.ts    # Track problem recurrence
└── html-enhancer.ts         # Rich HTML generation
```

### Data Flow

```
Conversas + Relatórios (janela N dias)
    ↓
[Pattern Detector] → patterns[] (tema, count, sources)
    ↓
[Recurrence Tracker] → recurrence[] (new vs recurring)
    ↓
[Semantic Cluster] → clusters[] (grupos similares)
    ↓
[Trend Analyzer] → trends[] (vs período anterior)
    ↓
LLM (qwen-max) com contexto enriquecido
    ↓
[HTML Enhancer] → Visual report
    ↓
Save + Create Issues
```

---

## Schema Evolution

### Current (v1)

```typescript
interface AIReportV1 {
  insights: Array<{
    titulo: string;
    descricao: string;
    categoria: string;
    severidade: string;
    evidencias?: string;
  }>;
  padroes_detectados: string[];
  topicos_pendentes: Array<{
    titulo: string;
    descricao: string;
    categoria: string;
  }>;
}
```

### Proposed (v2)

```typescript
interface AIReportV2 extends AIReportV1 {
  // Cross-report analysis
  cross_report_patterns: Array<{
    pattern_id: string;
    theme: string;
    occurrence_count: number;
    source_reports: string[]; // report IDs
    confidence: number; // 0-1
    first_seen: string; // ISO date
    trend: 'increasing' | 'stable' | 'decreasing';
  }>;

  // Trend analysis
  trend_comparison: {
    previous_period_reports: number;
    current_period_reports: number;
    change_percent: number;
    top_increasing_themes: Array<{ theme: string; change: number }>;
    top_decreasing_themes: Array<{ theme: string; change: number }>;
  };

  // Semantic clusters
  semantic_clusters: Array<{
    cluster_id: string;
    theme_summary: string;
    report_count: number;
    representative_reports: string[];
    keywords: string[];
  }>;

  // Recurrence tracking
  recurrence_analysis: {
    new_issues: number;
    recurring_issues: number;
    resolved_issues: number; // from previous report
    persistent_problems: Array<{
      problem_summary: string;
      first_reported: string;
      recurrence_count: number;
    }>;
  };
}
```

---

## Implementation Phases

### Phase 1: Enhanced Prompt (30 min)

- Modify `buildIntelligenceReportPrompt()` to request comparative analysis
- Add explicit instructions for pattern detection
- Update JSON schema in FORMAT_INTELLIGENCE_REPORT

### Phase 2: Pattern Detection (45 min)

- Implement `pattern-detector.ts`
- Use keyword extraction + similarity scoring
- Store patterns in `metadata.patterns_v2`

### Phase 3: Trend Analysis (45 min)

- Implement `trend-analyzer.ts`
- Query previous AI report for comparison
- Calculate delta metrics

### Phase 4: Rich HTML (30 min)

- Implement `html-enhancer.ts`
- Add badges, progress bars, trend arrows
- Dark mode visual components

### Phase 5: Integration (30 min)

- Wire into `/api/ai-reports/generate/route.ts`
- Add feature flag (v2_enabled)
- Backward compatibility

---

## Success Metrics

| Metric | v1 (baseline) | v2 (target) |
|--------|---------------|-------------|
| Pattern detection | 0% | >70% of recurring themes |
| Cross-report insights | Manual | Auto-generated |
| HTML richness | Basic | Visual components |
| User engagement | Unknown | +20% report views |

---

## Migration Strategy

1. **Backward compatible**: v1 reports continue working
2. **Feature flag**: `ENABLE_AI_REPORTS_V2` env var
3. **Gradual rollout**: Start with manual trigger, then auto
4. **Rollback**: Switch flag to revert

---

## Related Files

- `/api/ai-reports/generate/route.ts` — Main route
- `/lib/prompt.ts` — Intelligence report prompt
- `/lib/supabase.ts` — DB operations
- `supabase/migrations/` — Schema updates

---

**Author:** Cascade (EGOS Agent)  
**Date:** 2026-04-08  
**Ref:** CHAT-010, EGOS v2.55.0

/**
 * 📊 INSIGHT WEIGHTING — Prioritize insights by operational criticality
 *
 * **Why:** Some issues are more critical than others (staffing > scheduling)
 * **When:** After AI extracts insights, before sorting and display
 * **Used by:** api/ai-reports/generate/route.ts (post-processing)
 * **Inputs:** insights[] from AI report JSON, optional custom weights
 * **Outputs:** reweighted insights[] sorted by criticality
 *
 * **Knowledge Graph:**
 * - Feeds from: AI intelligence_report JSON output
 * - Feeds into: Report display, pending_topics prioritization
 * - Depends on: Category classification (infraestrutura|efetivo|etc)
 */

interface Insight {
  titulo: string;
  descricao: string;
  categoria: 'infraestrutura' | 'efetivo' | 'assedio' | 'plantao' | 'carreira' | 'tecnologia' | 'outro';
  severidade: 'critica' | 'alta' | 'media' | 'baixa';
  evidencias?: string;
  [key: string]: unknown;
}

interface WeightedInsight extends Insight {
  weight: number;
  severidade_score: number;
  final_score: number;
}

// Category weights (multiplicative)
// Higher weight = higher priority in display/analysis
export const CATEGORY_WEIGHTS: Record<string, number> = {
  assedio: 3.5,        // Safety issue = CRITICAL (highest priority)
  efetivo: 3.0,        // Staffing = critical operational impact
  infraestrutura: 2.5, // Infrastructure = high impact
  plantao: 2.0,        // Scheduling = medium-high impact
  tecnologia: 1.5,     // Technology = medium impact
  carreira: 1.0,       // Career = medium impact
  outro: 1.0,          // Other = baseline weight
};

// Severity scores (base points before weighting)
const SEVERITY_SCORES: Record<string, number> = {
  critica: 4,
  alta: 3,
  media: 2,
  baixa: 1,
};

/**
 * Calculate final weighted score for an insight
 * Score = severity_score × category_weight
 * Example: "critica" efetivo insight = 4 × 3.0 = 12.0
 */
function calculateScore(insight: Insight, weights: Record<string, number> = CATEGORY_WEIGHTS): number {
  const baseScore = SEVERITY_SCORES[insight.severidade] || 1;
  const categoryWeight = weights[insight.categoria] || 1.0;
  return baseScore * categoryWeight;
}

/**
 * Apply category-based weighting to insights
 * Returns insights with added weight/score fields, sorted by final_score DESC
 */
export function applyInsightWeighting(
  insights: Insight[],
  customWeights?: Record<string, number>
): WeightedInsight[] {
  const weights = customWeights || CATEGORY_WEIGHTS;

  const weighted = insights.map((insight) => {
    const severidade_score = SEVERITY_SCORES[insight.severidade] || 1;
    const weight = weights[insight.categoria] || 1.0;
    const final_score = calculateScore(insight, weights);

    return {
      ...insight,
      weight,
      severidade_score,
      final_score,
    } as WeightedInsight;
  });

  // Sort by final_score descending (highest priority first)
  return weighted.sort((a, b) => b.final_score - a.final_score);
}

/**
 * Get human-readable weight explanation
 * Useful for logging/debugging
 */
export function explainWeight(insight: Insight, weights: Record<string, number> = CATEGORY_WEIGHTS): string {
  const severity = insight.severidade.toUpperCase();
  const severityScore = SEVERITY_SCORES[insight.severidade] || 1;
  const categoryWeight = weights[insight.categoria] || 1.0;
  const finalScore = severityScore * categoryWeight;

  return `${severity} ${insight.categoria} = ${severityScore} × ${categoryWeight} = ${finalScore.toFixed(1)}`;
}

/**
 * Filter insights by minimum priority threshold
 * Example: Get only insights with final_score >= 6.0 (critica × infraestrutura or higher)
 */
export function filterByMinScore(
  insights: WeightedInsight[],
  minScore: number
): WeightedInsight[] {
  return insights.filter((insight) => insight.final_score >= minScore);
}

/**
 * Group insights by category (for display/reporting)
 */
export function groupByCategory(insights: WeightedInsight[]): Record<string, WeightedInsight[]> {
  const grouped: Record<string, WeightedInsight[]> = {};

  insights.forEach((insight) => {
    const cat = insight.categoria || 'outro';
    if (!grouped[cat]) {
      grouped[cat] = [];
    }
    grouped[cat].push(insight);
  });

  // Sort each group internally by score
  Object.keys(grouped).forEach((cat) => {
    grouped[cat].sort((a, b) => b.final_score - a.final_score);
  });

  return grouped;
}

export type { Insight, WeightedInsight };

/**
 * AI Reports v2 — Pattern Detector
 *
 * Detects cross-report patterns by analyzing recurring themes
 * across multiple conversations and reports.
 *
 * @module ai-reports-v2/pattern-detector
 */

export interface CrossReportPattern {
  pattern_id: string;
  theme: string;
  occurrence_count: number;
  source_conversations: string[]; // conversation IDs
  confidence: number; // 0-1
  keywords: string[];
  trend: 'increasing' | 'stable' | 'decreasing' | 'new';
}

interface ConversationData {
  id: string;
  messages: Array<{ role: string; content: string }>;
  title?: string;
  created_at?: string;
}

interface ReportReviewData {
  temas?: string[];
  resumo?: string;
  categoria?: string;
}

// Brazilian police operational keywords for pattern detection
const THEME_KEYWORDS: Record<string, string[]> = {
  efetivo: ['efetivo', 'falta gente', 'subdimensionado', 'escassez', 'quadro', 'pessoal', 'funcionários'],
  viatura: ['viatura', 'frota', 'carro', 'automóvel', 'veículo', 'moto', 'transporte'],
  sistema: ['sistema', 'REDS', 'integrado', 'computador', 'login', 'senha', 'bug', 'falha técnica'],
  plantao: ['plantão', 'escala', 'sobrecarga', 'carga horária', '24 horas', 'turno'],
  infraestrutura: ['infraestrutura', 'prédio', 'sala', 'ar condicionado', 'elevador', 'banheiro'],
  assedio: ['assédio', 'pressão', 'intimidação', 'ambiente tóxico', 'discriminação'],
  armamento: ['arma', 'munição', 'colete', 'equipamento', 'proteção', 'tático'],
  comunicacao: ['rádio', 'comunicação', 'telefone', 'celular', 'sinal'],
};

/**
 * Extract themes from text using keyword matching
 */
function extractThemes(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const foundThemes: string[] = [];

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    const hasKeyword = keywords.some(kw => normalizedText.includes(kw));
    if (hasKeyword && !foundThemes.includes(theme)) {
      foundThemes.push(theme);
    }
  }

  return foundThemes;
}

/**
 * Calculate similarity between two texts (simple Jaccard index)
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Detect cross-report patterns from conversations and reviews
 */
export function detectCrossReportPatterns(
  conversations: ConversationData[],
  reportReviews: Map<string, ReportReviewData>
): CrossReportPattern[] {
  const patterns: Map<string, CrossReportPattern> = new Map();

  // Step 1: Extract themes from each conversation
  for (const conv of conversations) {
    const allText = conv.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ');

    const themes = extractThemes(allText);

    // Step 2: Also check review data if available
    const review = reportReviews.get(conv.id);
    if (review?.temas) {
      for (const tema of review.temas) {
        const normalized = tema.toLowerCase();
        for (const [themeKey] of Object.entries(THEME_KEYWORDS)) {
          if (normalized.includes(themeKey) && !themes.includes(themeKey)) {
            themes.push(themeKey);
          }
        }
      }
    }

    // Step 3: Accumulate patterns
    for (const theme of themes) {
      const existing = patterns.get(theme);
      if (existing) {
        existing.occurrence_count++;
        if (!existing.source_conversations.includes(conv.id)) {
          existing.source_conversations.push(conv.id);
        }
      } else {
        patterns.set(theme, {
          pattern_id: `pattern_${theme}_${Date.now()}`,
          theme: theme,
          occurrence_count: 1,
          source_conversations: [conv.id],
          confidence: 0.5, // Initial confidence
          keywords: THEME_KEYWORDS[theme] || [],
          trend: 'new',
        });
      }
    }
  }

  // Step 4: Calculate confidence based on occurrence count
  const result: CrossReportPattern[] = [];
  for (const pattern of patterns.values()) {
    // Higher occurrence = higher confidence
    pattern.confidence = Math.min(0.95, 0.5 + (pattern.occurrence_count * 0.1));

    // Only include patterns with 2+ occurrences
    if (pattern.occurrence_count >= 2) {
      result.push(pattern);
    }
  }

  // Sort by occurrence count (descending)
  return result.sort((a, b) => b.occurrence_count - a.occurrence_count);
}

/**
 * Generate natural language description of patterns
 */
export function describePatterns(patterns: CrossReportPattern[]): string {
  if (patterns.length === 0) {
    return 'Nenhum padrão recorrente detectado no período.';
  }

  const descriptions = patterns.map(p => {
    const count = p.occurrence_count;
    const theme = p.theme;
    return `${count} ${count === 1 ? 'relato menciona' : 'relatos mencionam'} ${theme}`;
  });

  return descriptions.join('; ');
}

/**
 * Check if a report is similar to previous reports (recurrence detection)
 */
export function checkRecurrence(
  newReportText: string,
  previousReports: Array<{ id: string; text: string; created_at: string }>
): {
  isRecurring: boolean;
  similarReports: Array<{ id: string; similarity: number }>;
  suggestedTheme: string;
} {
  const similarities: Array<{ id: string; similarity: number }> = [];

  for (const prev of previousReports) {
    const sim = calculateSimilarity(newReportText, prev.text);
    if (sim > 0.4) { // Threshold for similarity
      similarities.push({ id: prev.id, similarity: sim });
    }
  }

  similarities.sort((a, b) => b.similarity - a.similarity);

  const themes = extractThemes(newReportText);

  return {
    isRecurring: similarities.length > 0 && similarities[0].similarity > 0.6,
    similarReports: similarities.slice(0, 3),
    suggestedTheme: themes[0] || 'outro',
  };
}

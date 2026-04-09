/**
 * Cross-Conversation Insight Aggregation — 852 Inteligência
 *
 * Analyzes multiple conversations to identify themes, patterns, and aggregated insights.
 * Provides institutional intelligence across conversation boundaries.
 */

import { getSupabase } from './supabase';

export interface ConversationInsight {
  id: string;
  conversationId: string;
  userId?: string;
  themes: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  urgency: number; // 0-10
  category: string;
  keywords: string[];
  entities: string[];
  createdAt: string;
  lotacao?: string;
}

export interface AggregatedInsight {
  period: { start: string; end: string };
  totalConversations: number;
  topThemes: Array<{ theme: string; count: number; percentage: number }>;
  sentimentDistribution: Record<string, number>;
  categoryBreakdown: Array<{ category: string; count: number }>;
  trendingKeywords: Array<{ keyword: string; trend: 'up' | 'down' | 'stable'; mentions: number }>;
  regionalPatterns: Array<{ region: string; topIssue: string; count: number }>;
  emergingIssues: string[];
  recommendations: string[];
}

// Theme extraction keywords
const THEME_KEYWORDS: Record<string, string[]> = {
  efetivo: ['falta gente', 'sem pessoal', 'quadro desfalcado', 'precisamos de mais', 'escala falta'],
  viatura: ['carro quebrado', 'frota', 'sem viatura', 'manutenção', 'combustível'],
  sistema: ['REDS lento', 'sistema travando', 'intranet', 'computador', 'senha expirando'],
  infraestrutura: ['ar condicionado', 'elevador', 'prédio', 'sala', 'reforma'],
  armamento: ['arma', 'munição', 'colete', 'rádio', 'equipamento'],
  carreira: ['promoção', 'concurso', 'progressão', 'cargo', 'ascensão'],
  saude: ['estresse', 'burnout', 'psicólogo', 'saúde mental', 'ansiedade'],
  escala: ['plantão', 'escala abusiva', 'folga', 'sobrecarga', 'extra'],
};

const SENTIMENT_PATTERNS = {
  positive: ['obrigado', 'bom', 'ótimo', 'excelente', 'satisfeito', 'resolveram'],
  negative: ['ruim', 'péssimo', 'horrível', 'insatisfeito', 'problema', 'falta', 'não funciona'],
};

/**
 * Extract themes from conversation text
 */
export function extractThemes(text: string): string[] {
  const normalized = text.toLowerCase();
  const themes: string[] = [];

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    const hasMatch = keywords.some(kw => normalized.includes(kw));
    if (hasMatch && !themes.includes(theme)) {
      themes.push(theme);
    }
  }

  return themes;
}

/**
 * Analyze sentiment of text
 */
export function analyzeSentiment(text: string): ConversationInsight['sentiment'] {
  const normalized = text.toLowerCase();
  let positive = 0;
  let negative = 0;

  for (const pattern of SENTIMENT_PATTERNS.positive) {
    if (normalized.includes(pattern)) positive++;
  }

  for (const pattern of SENTIMENT_PATTERNS.negative) {
    if (normalized.includes(pattern)) negative++;
  }

  if (positive > negative) return 'positive';
  if (negative > positive) return 'negative';
  if (positive > 0 && negative > 0) return 'mixed';
  return 'neutral';
}

/**
 * Calculate urgency score (0-10)
 */
export function calculateUrgency(text: string): number {
  const normalized = text.toLowerCase();
  let score = 0;

  // Urgency indicators
  const urgentPatterns = [
    'urgente', 'emergência', 'agora', 'imediato', 'crítico',
    'parou', 'quebrou', 'sem funcionar', 'impedindo',
  ];

  for (const pattern of urgentPatterns) {
    if (normalized.includes(pattern)) score += 2;
  }

  // Severity escalation
  if (normalized.includes('todos') || normalized.includes('geral')) score += 2;
  if (normalized.includes('semana') || normalized.includes('dias')) score += 1;
  if (normalized.includes('meses') || normalized.includes('anos')) score -= 1;

  return Math.min(10, Math.max(0, score));
}

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string): string[] {
  const normalized = text.toLowerCase();

  // Remove common words
  const stopWords = ['o', 'a', 'os', 'as', 'de', 'da', 'do', 'em', 'no', 'na', 'para', 'por', 'com', 'sem'];

  // Extract potential keywords (3+ chars)
  const words = normalized
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !stopWords.includes(w));

  // Count frequency
  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  // Return top keywords (appearing 2+ times or specific operational terms)
  const operationalTerms = ['plantão', 'viatura', 'efetivo', 'sistema', 'delegacia', 'escala', 'folga'];

  return Array.from(freq.entries())
    .filter(([word, count]) => count >= 2 || operationalTerms.includes(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Analyze single conversation
 */
export function analyzeConversation(
  conversationId: string,
  messages: Array<{ role: string; content: string }>,
  metadata?: { userId?: string; lotacao?: string; createdAt?: string }
): ConversationInsight {
  // Combine all user messages for analysis
  const userText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ');

  const themes = extractThemes(userText);
  const sentiment = analyzeSentiment(userText);
  const urgency = calculateUrgency(userText);
  const keywords = extractKeywords(userText);

  // Determine primary category
  const category = themes[0] || 'geral';

  return {
    id: `insight_${conversationId}_${Date.now()}`,
    conversationId,
    userId: metadata?.userId,
    themes,
    sentiment,
    urgency,
    category,
    keywords,
    entities: [], // Would need NER for entities
    createdAt: metadata?.createdAt || new Date().toISOString(),
    lotacao: metadata?.lotacao,
  };
}

/**
 * Aggregate insights across multiple conversations
 */
export async function aggregateInsights(
  days: number = 30
): Promise<AggregatedInsight> {
  const sb = getSupabase();
  if (!sb) {
    throw new Error('Supabase not configured');
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Fetch conversations with messages
  const { data: conversations, error } = await sb
    .from('conversations_852')
    .select('id, messages, user_id, lotacao, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (error || !conversations) {
    console.error('[cross-conversation] fetch error:', error);
    return createEmptyAggregation(startDate, endDate);
  }

  // Analyze each conversation
  const insights: ConversationInsight[] = [];
  for (const conv of conversations) {
    const messages = typeof conv.messages === 'string'
      ? JSON.parse(conv.messages)
      : conv.messages || [];

    const insight = analyzeConversation(conv.id, messages, {
      userId: conv.user_id,
      lotacao: conv.lotacao,
      createdAt: conv.created_at,
    });

    insights.push(insight);
  }

  // Aggregate themes
  const themeCounts = new Map<string, number>();
  for (const insight of insights) {
    for (const theme of insight.themes) {
      themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
    }
  }

  const topThemes = Array.from(themeCounts.entries())
    .map(([theme, count]) => ({
      theme,
      count,
      percentage: Math.round((count / insights.length) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Sentiment distribution
  const sentimentDist: Record<string, number> = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
  for (const insight of insights) {
    sentimentDist[insight.sentiment]++;
  }

  // Category breakdown
  const categoryCounts = new Map<string, number>();
  for (const insight of insights) {
    categoryCounts.set(insight.category, (categoryCounts.get(insight.category) || 0) + 1);
  }

  const categoryBreakdown = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Trending keywords
  const keywordCounts = new Map<string, number>();
  for (const insight of insights) {
    for (const kw of insight.keywords) {
      keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1);
    }
  }

  const trendingKeywords = Array.from(keywordCounts.entries())
    .map(([keyword, mentions]) => ({
      keyword,
      mentions,
      trend: mentions > 5 ? 'up' : mentions > 2 ? 'stable' : 'down' as 'up' | 'down' | 'stable',
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 15);

  // Regional patterns (by lotacao)
  const lotacaoIssues = new Map<string, Map<string, number>>();
  for (const insight of insights) {
    if (!insight.lotacao) continue;

    const issues = lotacaoIssues.get(insight.lotacao) || new Map<string, number>();
    for (const theme of insight.themes) {
      issues.set(theme, (issues.get(theme) || 0) + 1);
    }
    lotacaoIssues.set(insight.lotacao, issues);
  }

  const regionalPatterns = Array.from(lotacaoIssues.entries())
    .map(([region, issues]) => {
      const topIssue = Array.from(issues.entries())
        .sort((a, b) => b[1] - a[1])[0];
      return {
        region,
        topIssue: topIssue?.[0] || 'geral',
        count: topIssue?.[1] || 0,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Emerging issues (high urgency, recent)
  const recentHighUrgency = insights
    .filter(i => i.urgency >= 7)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const emergingIssues = [...new Set(recentHighUrgency.flatMap(i => i.themes))];

  // Generate recommendations
  const recommendations = generateRecommendations(topThemes, sentimentDist, emergingIssues);

  return {
    period: { start: startDate.toISOString(), end: endDate.toISOString() },
    totalConversations: insights.length,
    topThemes,
    sentimentDistribution: sentimentDist,
    categoryBreakdown,
    trendingKeywords,
    regionalPatterns,
    emergingIssues,
    recommendations,
  };
}

function createEmptyAggregation(startDate: Date, endDate: Date): AggregatedInsight {
  return {
    period: { start: startDate.toISOString(), end: endDate.toISOString() },
    totalConversations: 0,
    topThemes: [],
    sentimentDistribution: { positive: 0, negative: 0, neutral: 0, mixed: 0 },
    categoryBreakdown: [],
    trendingKeywords: [],
    regionalPatterns: [],
    emergingIssues: [],
    recommendations: [],
  };
}

function generateRecommendations(
  topThemes: AggregatedInsight['topThemes'],
  sentimentDist: Record<string, number>,
  emergingIssues: string[]
): string[] {
  const recommendations: string[] = [];

  // Theme-based recommendations
  const topTheme = topThemes[0];
  if (topTheme && topTheme.percentage > 30) {
    recommendations.push(
      `Priorizar atenção ao tema "${topTheme.theme}" (${topTheme.percentage}% das conversas)`
    );
  }

  // Sentiment-based
  const total = Object.values(sentimentDist).reduce((a, b) => a + b, 0);
  const negativePct = total > 0 ? (sentimentDist.negative / total) * 100 : 0;
  if (negativePct > 40) {
    recommendations.push(
      `Índice de insatisfação elevado (${Math.round(negativePct)}%). Recomenda-se ação institucional.`
    );
  }

  // Emerging issues
  if (emergingIssues.length > 0) {
    recommendations.push(
      `Questões emergentes urgentes: ${emergingIssues.slice(0, 3).join(', ')}`
    );
  }

  return recommendations;
}

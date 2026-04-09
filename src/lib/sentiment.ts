/**
 * Sentiment Analysis — 852 Inteligência
 *
 * Analyzes text sentiment from reports, issues, and comments.
 * Tracks mood trends over time for institutional intelligence.
 */

import { getSupabase } from './supabase';

// Sentiment categories
export type SentimentLabel = 'positive' | 'negative' | 'neutral' | 'mixed';

export interface SentimentScore {
  label: SentimentLabel;
  confidence: number; // 0-1
  scores: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface SentimentTrend {
  date: string;
  avgSentiment: number; // -1 to 1
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  total: number;
  topTopics: string[];
}

export interface SentimentAnalysis {
  id: string;
  sourceType: 'report' | 'issue' | 'comment';
  sourceId: string;
  sentiment: SentimentScore;
  keyPhrases: string[];
  urgencyIndicators: string[];
  createdAt: string;
}

// Portuguese sentiment keywords
const SENTIMENT_LEXICON: Record<string, number> = {
  // Positive (police operational context)
  'excelente': 0.8,
  'ótimo': 0.8,
  'bom': 0.6,
  'resolver': 0.5,
  'solução': 0.5,
  'melhorou': 0.6,
  'eficiente': 0.7,
  'funcionando': 0.5,
  'apoio': 0.4,
  'suporte': 0.4,
  'agradecido': 0.7,
  'satisfeito': 0.6,
  'rápido': 0.4,
  'eficaz': 0.6,
  'recomendo': 0.7,
  'positivo': 0.5,
  'progresso': 0.5,
  'avanço': 0.5,
  'sucesso': 0.8,
  'conseguimos': 0.6,
  'resultado': 0.4,
  'qualidade': 0.5,
  'organizado': 0.4,
  'comprometido': 0.5,

  // Negative (operational pain points)
  'problema': -0.5,
  'falta': -0.6,
  'deficiente': -0.7,
  'ruim': -0.6,
  'péssimo': -0.8,
  'lento': -0.5,
  'demora': -0.6,
  'burocracia': -0.5,
  'improdutivo': -0.6,
  'desorganizado': -0.6,
  'falha': -0.7,
  'erro': -0.5,
  'quebrado': -0.6,
  'insuficiente': -0.6,
  'precário': -0.7,
  'abandonado': -0.7,
  'esquecido': -0.5,
  'negligenciado': -0.8,
  'corrupto': -0.9,
  'injusto': -0.7,
  'discriminação': -0.8,
  'assédio': -0.9,
  'perigo': -0.7,
  'inseguro': -0.6,
  'violência': -0.8,
  'risco': -0.5,
  'emergência': -0.4,
  'urgente': -0.3,
  'crítico': -0.5,
  'grave': -0.6,
  'sério': -0.4,

  // Urgency indicators
  'imediatamente': -0.4,
  'agora': -0.2,
  'hoje': -0.2,
  'prazo': -0.3,
  'deadline': -0.3,
  'atrasado': -0.6,
  'pendente': -0.4,
  'esperando': -0.3,
  'nada fez': -0.7,
  'sem resposta': -0.6,
  'ignorado': -0.7,
};

// Intensifiers
const INTENSIFIERS: Record<string, number> = {
  'muito': 1.5,
  'extremamente': 2.0,
  'bastante': 1.3,
  'pouco': 0.7,
  'totalmente': 1.8,
  'completamente': 1.8,
  'absolutamente': 1.9,
  'realmente': 1.4,
  'demais': 1.6,
};

// Negations
const NEGATIONS = ['não', 'nunca', 'jamais', 'sem', 'falta', 'impossível'];

/**
 * Analyze sentiment of text using lexicon-based approach
 */
export function analyzeSentiment(text: string): SentimentScore {
  const words = text.toLowerCase()
    .replace(/[.,!?;:"'()]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0.1; // Base neutral

  let i = 0;
  while (i < words.length) {
    const word = words[i];
    const nextWord = words[i + 1];

    // Check for negation
    const isNegated = NEGATIONS.includes(word) ||
      (i > 0 && NEGATIONS.includes(words[i - 1]));

    // Check if next word is in lexicon
    if (SENTIMENT_LEXICON[nextWord]) {
      let score = SENTIMENT_LEXICON[nextWord];

      // Apply negation (flip sentiment)
      if (isNegated) {
        score = -score * 0.5; // Dampened flip
      }

      // Apply intensifier if present
      if (INTENSIFIERS[word]) {
        score *= INTENSIFIERS[word];
      }

      if (score > 0) {
        positiveScore += score;
      } else {
        negativeScore += Math.abs(score);
      }
      i += 2;
    } else if (SENTIMENT_LEXICON[word]) {
      let score = SENTIMENT_LEXICON[word];

      // Check for negation before this word
      if (i > 0 && NEGATIONS.includes(words[i - 1])) {
        score = -score * 0.5;
      }

      if (score > 0) {
        positiveScore += score;
      } else {
        negativeScore += Math.abs(score);
      }
      i++;
    } else {
      i++;
    }
  }

  // Normalize scores
  const total = positiveScore + negativeScore + neutralScore;
  const normalizedPositive = positiveScore / total;
  const normalizedNegative = negativeScore / total;
  const normalizedNeutral = Math.max(0, 1 - normalizedPositive - normalizedNegative);

  // Determine label
  let label: SentimentLabel;
  const maxScore = Math.max(normalizedPositive, normalizedNegative, normalizedNeutral);

  if (maxScore === normalizedPositive) {
    label = 'positive';
  } else if (maxScore === normalizedNegative) {
    label = 'negative';
  } else if (Math.abs(normalizedPositive - normalizedNegative) < 0.2) {
    label = 'mixed';
  } else {
    label = 'neutral';
  }

  // Calculate overall confidence
  const confidence = maxScore;

  return {
    label,
    confidence,
    scores: {
      positive: normalizedPositive,
      negative: normalizedNegative,
      neutral: normalizedNeutral,
    },
  };
}

/**
 * Extract urgency indicators from text
 */
export function extractUrgencyIndicators(text: string): string[] {
  const indicators: string[] = [];
  const lowerText = text.toLowerCase();

  const urgencyPatterns = [
    'urgente',
    'emergência',
    'imediato',
    'agora',
    'hoje',
    'prazo',
    'deadline',
    'atrasado',
    'atraso',
    'esperando',
    'nada fez',
    'sem resposta',
    'ignorado',
    'crítico',
    'grave',
    'risco',
    'perigo',
    'inseguro',
  ];

  for (const pattern of urgencyPatterns) {
    if (lowerText.includes(pattern)) {
      indicators.push(pattern);
    }
  }

  return [...new Set(indicators)];
}

/**
 * Extract key phrases (noun phrases) from text
 */
export function extractKeyPhrases(text: string): string[] {
  // Simple extraction of capitalized phrases and multi-word terms
  const phrases: string[] = [];

  // Common operational terms in police context
  const operationalTerms = [
    'viatura',
    'efetivo',
    'arma',
    'colete',
    'munição',
    'equipamento',
    'sistema',
    'plantão',
    'escala',
    'férias',
    'licença',
    'atestado',
    'remuneração',
    'salário',
    'adiantamento',
    'gratificação',
    'curso',
    'treinamento',
    'capacitação',
    'promoção',
    'transferência',
    'lotacao',
    'delegacia',
    'superintendencia',
    'corregedoria',
    'inteligência',
    'investigação',
    'patrulhamento',
    'abordagem',
    'ocorrência',
    'boletim',
    'registro',
    'flagrante',
    'inquérito',
    'auto',
    'prisão',
    'condução',
    'mandado',
    'busca',
    'apreensão',
    'veículo',
    'celular',
    'computador',
    'servidor',
    'rede',
    'internet',
    'senha',
    'acesso',
    'login',
    'sistema',
    'software',
    'aplicativo',
    'app',
    'plataforma',
    'tira-voz',
    'helios',
    'olho vivo',
    'siisp',
    'reds',
    'infopol',
    'interpol',
  ];

  const lowerText = text.toLowerCase();

  for (const term of operationalTerms) {
    if (lowerText.includes(term)) {
      phrases.push(term);
    }
  }

  return [...new Set(phrases)].slice(0, 10);
}

/**
 * Save sentiment analysis to database
 */
export async function saveSentimentAnalysis(
  sourceType: 'report' | 'issue' | 'comment',
  sourceId: string,
  text: string
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const sentiment = analyzeSentiment(text);
  const keyPhrases = extractKeyPhrases(text);
  const urgencyIndicators = extractUrgencyIndicators(text);

  try {
    const { data, error } = await sb
      .from('sentiment_analysis_852')
      .insert({
        source_type: sourceType,
        source_id: sourceId,
        sentiment_label: sentiment.label,
        sentiment_confidence: sentiment.confidence,
        positive_score: sentiment.scores.positive,
        negative_score: sentiment.scores.negative,
        neutral_score: sentiment.scores.neutral,
        key_phrases: keyPhrases,
        urgency_indicators: urgencyIndicators,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Sentiment] Failed to save:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('[Sentiment] Error saving:', error);
    return null;
  }
}

/**
 * Get sentiment trends over time
 */
export async function getSentimentTrends(days = 30): Promise<SentimentTrend[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await sb
    .from('sentiment_analysis_852')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.error('[Sentiment] Failed to fetch trends:', error);
    return [];
  }

  // Group by day
  const dailyData: Record<string, typeof data> = {};

  for (const item of data) {
    const date = item.created_at.split('T')[0];
    if (!dailyData[date]) {
      dailyData[date] = [];
    }
    dailyData[date].push(item);
  }

  // Calculate trends
  const trends: SentimentTrend[] = [];

  for (const [date, items] of Object.entries(dailyData)) {
    const positiveCount = items.filter((i) => i.sentiment_label === 'positive').length;
    const negativeCount = items.filter((i) => i.sentiment_label === 'negative').length;
    const neutralCount = items.filter(
      (i) => i.sentiment_label === 'neutral' || i.sentiment_label === 'mixed'
    ).length;
    const total = items.length;

    // Calculate average sentiment (-1 to 1)
    let sentimentSum = 0;
    for (const item of items) {
      sentimentSum += item.positive_score - item.negative_score;
    }
    const avgSentiment = total > 0 ? sentimentSum / total : 0;

    // Get top topics
    const topicCounts: Record<string, number> = {};
    for (const item of items) {
      for (const phrase of item.key_phrases || []) {
        topicCounts[phrase] = (topicCounts[phrase] || 0) + 1;
      }
    }
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    trends.push({
      date,
      avgSentiment: Math.round(avgSentiment * 100) / 100,
      positiveCount,
      negativeCount,
      neutralCount,
      total,
      topTopics,
    });
  }

  return trends.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get overall sentiment statistics
 */
export async function getSentimentStats(days = 30): Promise<{
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  avgSentiment: number;
  topUrgencyIndicators: string[];
  trendingTopics: string[];
}> {
  const sb = getSupabase();
  if (!sb) {
    return {
      total: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      avgSentiment: 0,
      topUrgencyIndicators: [],
      trendingTopics: [],
    };
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await sb
    .from('sentiment_analysis_852')
    .select('*')
    .gte('created_at', since.toISOString());

  if (error || !data) {
    return {
      total: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      avgSentiment: 0,
      topUrgencyIndicators: [],
      trendingTopics: [],
    };
  }

  const total = data.length;
  const positive = data.filter((d) => d.sentiment_label === 'positive').length;
  const negative = data.filter((d) => d.sentiment_label === 'negative').length;
  const neutral = total - positive - negative;

  // Average sentiment
  const sentimentSum = data.reduce(
    (sum, d) => sum + (d.positive_score - d.negative_score),
    0
  );
  const avgSentiment = total > 0 ? sentimentSum / total : 0;

  // Top urgency indicators
  const urgencyCounts: Record<string, number> = {};
  for (const item of data) {
    for (const indicator of item.urgency_indicators || []) {
      urgencyCounts[indicator] = (urgencyCounts[indicator] || 0) + 1;
    }
  }
  const topUrgencyIndicators = Object.entries(urgencyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  // Trending topics
  const topicCounts: Record<string, number> = {};
  for (const item of data) {
    for (const phrase of item.key_phrases || []) {
      topicCounts[phrase] = (topicCounts[phrase] || 0) + 1;
    }
  }
  const trendingTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k]) => k);

  return {
    total,
    positive,
    negative,
    neutral,
    avgSentiment: Math.round(avgSentiment * 100) / 100,
    topUrgencyIndicators,
    trendingTopics,
  };
}

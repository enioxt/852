/**
 * Admin Sentiment Analysis API — 852 Inteligência
 *
 * Returns sentiment trends and analysis for reports/issues.
 * Requires admin authentication.
 */

import { getCurrentAdmin } from '@/lib/admin-auth';
import {
  getSentimentTrends,
  getSentimentStats,
  analyzeSentiment,
  extractUrgencyIndicators,
  extractKeyPhrases,
} from '@/lib/sentiment';
import { recordEvent } from '@/lib/telemetry';

/**
 * GET /api/admin/sentiment
 * Get sentiment trends and statistics
 */
export async function GET(req: Request) {
  try {
    // Verify admin authentication
    const admin = await getCurrentAdmin();
    if (!admin) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Validate days parameter
    if (days < 1 || days > 90) {
      return Response.json(
        { error: 'Período inválido. Use entre 1 e 90 dias.' },
        { status: 400 }
      );
    }

    // Get trends and stats in parallel
    const [trends, stats] = await Promise.all([
      getSentimentTrends(days),
      getSentimentStats(days),
    ]);

    // Record telemetry
    recordEvent({
      event_type: 'admin_sentiment_viewed',
      metadata: {
        adminId: admin.id,
        days,
      },
    });

    return Response.json({
      success: true,
      days,
      trends,
      stats,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[api/admin/sentiment] error:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/admin/sentiment/analyze
 * Analyze text sentiment (for testing)
 */
export async function POST(req: Request) {
  try {
    // Verify admin authentication
    const admin = await getCurrentAdmin();
    if (!admin) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return Response.json(
        { error: 'Texto obrigatório' },
        { status: 400 }
      );
    }

    const sentiment = analyzeSentiment(text);
    const urgencyIndicators = extractUrgencyIndicators(text);
    const keyPhrases = extractKeyPhrases(text);

    return Response.json({
      success: true,
      analysis: {
        sentiment,
        urgencyIndicators,
        keyPhrases,
      },
    });
  } catch (error) {
    console.error('[api/admin/sentiment] error:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

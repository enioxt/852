/**
 * Insights Aggregation API — 852 Inteligência
 *
 * Returns aggregated cross-conversation insights.
 * Requires admin authentication.
 */

import { getCurrentAdmin } from '@/lib/admin-auth';
import { aggregateInsights } from '@/lib/cross-conversation-analyzer';
import { recordEvent } from '@/lib/telemetry';

/**
 * GET /api/insights/aggregate
 * Get aggregated insights across conversations
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

    // Aggregate insights
    const insights = await aggregateInsights(days);

    // Record telemetry
    recordEvent({
      event_type: 'insights_aggregation_viewed',
      metadata: {
        adminId: admin.id,
        days,
        totalConversations: insights.totalConversations,
      },
    });

    return Response.json({
      success: true,
      insights,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[api/insights/aggregate] error:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

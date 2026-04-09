/**
 * Admin Analytics API — 852 Inteligência
 *
 * Returns engagement metrics, retention, funnel, and cohort analysis.
 * Requires admin authentication.
 */

import { getCurrentAdmin } from '@/lib/admin-auth';
import {
  getEngagementSummary,
  getRetentionMetrics,
  getSessionMetrics,
  getFunnelMetrics,
  getDailyStats,
  getCohortAnalysis,
} from '@/lib/analytics';
import { recordEvent } from '@/lib/telemetry';

/**
 * GET /api/admin/analytics
 * Get comprehensive analytics data
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
    const metric = searchParams.get('metric'); // 'summary', 'retention', 'sessions', 'funnel', 'daily', 'cohorts'

    // Validate days parameter
    if (days < 1 || days > 90) {
      return Response.json(
        { error: 'Período inválido. Use entre 1 e 90 dias.' },
        { status: 400 }
      );
    }

    let data;
    const since = new Date();
    since.setDate(since.getDate() - days);

    switch (metric) {
      case 'retention':
        data = await getRetentionMetrics(since, new Date());
        break;
      case 'sessions':
        data = await getSessionMetrics(days);
        break;
      case 'funnel':
        data = await getFunnelMetrics(days);
        break;
      case 'daily':
        data = await getDailyStats(days);
        break;
      case 'cohorts':
        data = await getCohortAnalysis(days);
        break;
      case 'summary':
      default:
        data = await getEngagementSummary(days);
        break;
    }

    // Record telemetry
    recordEvent({
      event_type: 'admin_analytics_viewed',
      metadata: {
        adminId: admin.id,
        metric,
        days,
      },
    });

    return Response.json({
      success: true,
      metric: metric || 'summary',
      days,
      data,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[api/admin/analytics] error:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

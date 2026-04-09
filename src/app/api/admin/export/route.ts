/**
 * Admin Export API — 852 Inteligência
 *
 * Exports analytics data to CSV format for external analysis.
 * Requires admin authentication.
 */

import { getCurrentAdmin } from '@/lib/admin-auth';
import { getDailyStats } from '@/lib/analytics';
import { getSentimentTrends } from '@/lib/sentiment';
import { recordEvent } from '@/lib/telemetry';

/**
 * Convert array of objects to CSV string
 */
function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        // Handle arrays and objects
        if (Array.isArray(value)) {
          return `"${value.join(', ')}"`;
        }
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Escape quotes and wrap in quotes if contains comma
        const str = String(value ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * GET /api/admin/export?type=daily|sentiment&format=csv&days=30
 * Export analytics data
 */
export async function GET(req: Request) {
  try {
    // Verify admin authentication
    const admin = await getCurrentAdmin();
    if (!admin) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'daily'; // 'daily', 'sentiment'
    const format = searchParams.get('format') || 'csv'; // 'csv' only for now
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Validate parameters
    if (days < 1 || days > 90) {
      return Response.json(
        { error: 'Período inválido. Use entre 1 e 90 dias.' },
        { status: 400 }
      );
    }

    if (!['daily', 'sentiment'].includes(type)) {
      return Response.json(
        { error: 'Tipo inválido. Use: daily, sentiment' },
        { status: 400 }
      );
    }

    let data: Record<string, unknown>[] = [];
    let filename = '';

    // Fetch data based on type
    switch (type) {
      case 'daily':
        data = (await getDailyStats(days)) as unknown as Record<string, unknown>[];
        filename = `852-daily-stats-${days}d-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'sentiment':
        data = (await getSentimentTrends(days)) as unknown as Record<string, unknown>[];
        filename = `852-sentiment-trends-${days}d-${new Date().toISOString().split('T')[0]}.csv`;
        break;
    }

    // Convert to CSV
    const csv = toCSV(data);

    // Record telemetry
    recordEvent({
      event_type: 'admin_data_exported',
      metadata: {
        adminId: admin.id,
        type,
        format,
        days,
        rowCount: data.length,
      },
    });

    // Return CSV with proper headers
    const headers = new Headers({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    });

    return new Response('\uFEFF' + csv, { headers }); // BOM for Excel UTF-8 support
  } catch (error) {
    console.error('[api/admin/export] error:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

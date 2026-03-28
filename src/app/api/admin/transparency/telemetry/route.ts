import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('transparency_reports')
      .select('system, status, duration_ms')
      .gte('started_at', since);

    const stats = (data || []).reduce(
      (acc, r) => { acc.total++; acc[r.status] = (acc[r.status] || 0) + 1; return acc; },
      { total: 0, completed: 0, failed: 0, running: 0 } as Record<string, number>
    );

    return NextResponse.json({
      metrics: { reports: stats, successRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 100 },
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

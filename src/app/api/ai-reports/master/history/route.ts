/**
 * Master Report History API — 852 Inteligência
 *
 * Returns version history of the master intelligence report.
 * Limited to last 10 versions for performance.
 */

import { getSupabase } from '@/lib/supabase';

export const revalidate = 60; // Cache for 1 minute

export async function GET() {
  try {
    const sb = getSupabase();
    if (!sb) {
      return Response.json({ error: 'Supabase não configurado' }, { status: 503 });
    }

    // Get master report history (last 10 versions)
    const { data: history, error } = await sb
      .from('ai_reports_852')
      .select('id, version, created_at, updated_at, content_summary, total_conversations_all_time, total_reports_all_time, model_id, provider')
      .eq('is_master_report', true)
      .order('version', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[master-history] Error fetching history:', error);
      return Response.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    // Get current master (latest)
    const { data: current } = await sb
      .from('ai_reports_852')
      .select('version')
      .eq('is_master_report', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    return Response.json({
      history: history || [],
      currentVersion: current?.version || 0,
      count: history?.length || 0,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    console.error('[master-history] Unexpected error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

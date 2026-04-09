/**
 * Specific Master Report Version API — 852 Inteligência
 *
 * Returns a specific version of the master intelligence report.
 */

import { getSupabase } from '@/lib/supabase';

export const revalidate = 300; // Cache for 5 minutes (versions are immutable)

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ version: string }> }
) {
  try {
    const { version } = await params;
    const versionNum = parseInt(version, 10);

    if (isNaN(versionNum) || versionNum < 1) {
      return Response.json({ error: 'Invalid version number' }, { status: 400 });
    }

    const sb = getSupabase();
    if (!sb) {
      return Response.json({ error: 'Supabase não configurado' }, { status: 503 });
    }

    // Get specific version
    const { data: report, error } = await sb
      .from('ai_reports_852')
      .select('*')
      .eq('is_master_report', true)
      .eq('version', versionNum)
      .single();

    if (error || !report) {
      return Response.json({
        exists: false,
        message: `Version ${versionNum} not found`,
      }, { status: 404 });
    }

    return Response.json({
      exists: true,
      report,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.error('[master-version] Unexpected error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

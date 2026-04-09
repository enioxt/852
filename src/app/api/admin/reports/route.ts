/**
 * Admin Reports API — 852 Inteligência
 *
 * Returns all shared reports for admin viewing.
 * Requires admin authentication.
 */

import { getCurrentAdmin } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';
import { recordEvent } from '@/lib/telemetry';

export async function GET(req: Request) {
  try {
    // Verify admin authentication
    const admin = await getCurrentAdmin();
    if (!admin) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;

    const sb = getSupabase();
    if (!sb) {
      return Response.json({ error: 'Supabase não configurado' }, { status: 503 });
    }

    // Build query
    let query = sb
      .from('reports_852')
      .select('*, conversations_852!inner(title)', { count: 'exact' })
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: reports, error, count } = await query;

    if (error) {
      console.error('[admin/reports] query error:', error);
      return Response.json({ error: 'Erro ao buscar relatórios' }, { status: 500 });
    }

    // Record telemetry
    recordEvent({
      event_type: 'admin_reports_viewed',
      metadata: {
        adminId: admin.id,
        count: reports?.length || 0,
        total: count || 0,
        filters: { status, category },
      },
    });

    return Response.json({
      reports: reports || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[admin/reports] error:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

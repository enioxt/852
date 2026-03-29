import { getCurrentAdmin } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return Response.json({ configured: false, message: 'Supabase não configurado.' });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'all';
  const days = parseInt(url.searchParams.get('days') || '30', 10);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = 20;

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let query = sb
    .from('reports_852')
    .select('id, created_at, updated_at, status, messages, metadata, review_data, message_count, conversation_id', { count: 'exact' })
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (status !== 'all') {
    query = query.eq('status', status);
  } else {
    query = query.neq('status', 'deleted');
  }

  const { data, error, count } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Summary counts for the same window
  const [pendingRes, publishedRes, deletedRes] = await Promise.all([
    sb.from('reports_852').select('id', { count: 'exact', head: true }).eq('status', 'pending_human').gte('created_at', cutoff),
    sb.from('reports_852').select('id', { count: 'exact', head: true }).eq('status', 'published').gte('created_at', cutoff),
    sb.from('reports_852').select('id', { count: 'exact', head: true }).eq('status', 'deleted').gte('created_at', cutoff),
  ]);

  const reports = (data || []).map((r) => ({
    ...r,
    messages: typeof r.messages === 'string' ? JSON.parse(r.messages) : (r.messages || []),
    review_data: typeof r.review_data === 'string' ? JSON.parse(r.review_data) : r.review_data,
  }));

  return Response.json({
    configured: true,
    reports,
    pagination: {
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
    summary: {
      pending: pendingRes.count || 0,
      published: publishedRes.count || 0,
      deleted: deletedRes.count || 0,
    },
  });
}

import { getCurrentAdmin } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'all';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  const sb = getSupabase();
  if (!sb) {
    return Response.json({ error: 'Supabase não configurado' }, { status: 503 });
  }

  // Base query
  let query = sb
    .from('user_accounts_852')
    .select('id, email, display_name, nome_partial, masp, lotacao, validation_status, created_at, last_login, validated_by, validated_at', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Apply status filter
  if (status !== 'all') {
    query = query.eq('validation_status', status);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Fetch admin names for validated entries
  const validatedByIds = (data || [])
    .filter(u => u.validated_by)
    .map(u => u.validated_by)
    .filter((v, i, a) => a.indexOf(v) === i); // unique

  let adminNames: Record<string, string> = {};
  if (validatedByIds.length > 0) {
    const { data: admins } = await sb
      .from('admin_users_852')
      .select('id, name, email')
      .in('id', validatedByIds);
    
    adminNames = (admins || []).reduce((acc, a) => ({
      ...acc,
      [a.id]: a.name || a.email
    }), {});
  }

  // Get summary stats
  const { data: stats } = await sb
    .from('user_accounts_852')
    .select('validation_status');

  const summary = (stats || []).reduce(
    (acc, user) => {
      acc[user.validation_status] = (acc[user.validation_status] || 0) + 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0, none: 0 } as Record<string, number>
  );

  // Enrich data with admin names
  const enrichedData = (data || []).map(user => ({
    ...user,
    validated_by_name: user.validated_by ? adminNames[user.validated_by] || 'Admin desconhecido' : null
  }));

  return Response.json({
    configured: true,
    users: enrichedData,
    summary,
    pagination: {
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit
    }
  });
}

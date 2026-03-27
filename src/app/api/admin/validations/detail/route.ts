import { getCurrentAdmin } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return Response.json({ error: 'userId obrigatório' }, { status: 400 });
  }

  const sb = getSupabase();
  if (!sb) {
    return Response.json({ error: 'Supabase não configurado' }, { status: 503 });
  }

  // Get user details
  const { data: user, error: userError } = await sb
    .from('user_accounts_852')
    .select('id, email, display_name, nome_partial, masp, lotacao, validation_status, created_at, last_login, validated_by, validated_at, email_verified_at, auth_provider, reputation_points')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  // Get validator info
  let validator = null;
  if (user.validated_by) {
    const { data: v } = await sb
      .from('admin_users_852')
      .select('id, name, email')
      .eq('id', user.validated_by)
      .single();
    validator = v;
  }

  // Get user's chat activity
  const { data: chatStats } = await sb
    .from('telemetry_events')
    .select('event_type', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  // Get user's reports/issues
  const { data: reports } = await sb
    .from('reports')
    .select('id, title, created_at, status')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: issues } = await sb
    .from('issues')
    .select('id, title, created_at, status')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return Response.json({
    user: {
      ...user,
      validated_by_name: validator?.name || validator?.email || null
    },
    activity: {
      chatEvents: chatStats?.length || 0,
      reports: reports || [],
      issues: issues || []
    }
  });
}

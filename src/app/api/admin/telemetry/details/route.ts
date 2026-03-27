import { getCurrentAdmin } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'events';
  const days = Math.min(parseInt(searchParams.get('days') || '7'), 90);
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

  const sb = getSupabase();
  if (!sb) {
    return Response.json({ error: 'Supabase não configurado' }, { status: 503 });
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  switch (type) {
    case 'events': {
      const { data, error } = await sb
        .from('telemetry_events')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ events: data || [] });
    }

    case 'models': {
      const { data, error } = await sb
        .from('telemetry_events')
        .select('model_id, tokens_in, tokens_out, cost_usd')
        .gte('created_at', since)
        .not('model_id', 'is', null);

      if (error) return Response.json({ error: error.message }, { status: 500 });
      
      const stats = (data || []).reduce((acc, ev) => {
        const model = ev.model_id || 'unknown';
        if (!acc[model]) acc[model] = { count: 0, tokens: 0, cost: 0 };
        acc[model].count++;
        acc[model].tokens += (ev.tokens_in || 0) + (ev.tokens_out || 0);
        acc[model].cost += ev.cost_usd || 0;
        return acc;
      }, {} as Record<string, { count: number; tokens: number; cost: number }>);

      return Response.json({ models: stats });
    }

    case 'users': {
      const { data, error } = await sb
        .from('telemetry_events')
        .select('user_id, event_type, created_at')
        .gte('created_at', since)
        .not('user_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return Response.json({ error: error.message }, { status: 500 });

      const userStats = (data || []).reduce((acc, ev) => {
        const user = ev.user_id || 'anonymous';
        if (!acc[user]) acc[user] = { events: 0, lastActivity: ev.created_at };
        acc[user].events++;
        return acc;
      }, {} as Record<string, { events: number; lastActivity: string }>);

      return Response.json({ users: userStats });
    }

    case 'errors': {
      const { data, error } = await sb
        .from('telemetry_events')
        .select('*')
        .eq('event_type', 'chat_error')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ errors: data || [] });
    }

    case 'atrian': {
      const { data, error } = await sb
        .from('telemetry_events')
        .select('*')
        .eq('event_type', 'atrian_violation')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return Response.json({ error: error.message }, { status: 500 });

      const violations = (data || []).map(v => ({
        ...v,
        metadata: v.metadata as Record<string, unknown> || {}
      }));

      return Response.json({ violations });
    }

    default:
      return Response.json({ error: 'Tipo desconhecido' }, { status: 400 });
  }
}

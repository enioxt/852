import { getCurrentAdmin } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const sb = getSupabase();
  if (!sb) return Response.json({ error: 'Supabase não configurado' }, { status: 503 });

  const { data, error } = await sb
    .from('auth_invites_852')
    .select('id, email, invited_by, note, created_at, used_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ invites: data || [] });
}

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const sb = getSupabase();
  if (!sb) return Response.json({ error: 'Supabase não configurado' }, { status: 503 });

  const { email, note } = await req.json();
  if (!email || !String(email).includes('@')) {
    return Response.json({ error: 'Email inválido' }, { status: 400 });
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  const { data: existing } = await sb
    .from('auth_invites_852')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing) {
    return Response.json({ error: 'Este email já está na lista de convites.' }, { status: 409 });
  }

  const { data, error } = await sb
    .from('auth_invites_852')
    .insert({
      email: normalizedEmail,
      invited_by: admin.email,
      note: note?.trim() || null,
    })
    .select('id, email, invited_by, note, created_at, used_at')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ invite: data });
}

export async function DELETE(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const sb = getSupabase();
  if (!sb) return Response.json({ error: 'Supabase não configurado' }, { status: 503 });

  const { id } = await req.json();
  if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 });

  const { error } = await sb.from('auth_invites_852').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ deleted: true });
}

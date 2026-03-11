import { getCurrentAdmin } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';

type ValidationStatus = 'pending' | 'approved' | 'rejected';

function isValidationStatus(value: unknown): value is ValidationStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected';
}

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return Response.json({
      configured: false,
      message: 'Supabase não configurado. As validações manuais dependem do banco principal.',
      hint: 'Adicione SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ao .env para habilitar o painel.',
    });
  }

  const { data, error } = await sb
    .from('user_accounts_852')
    .select('id, email, display_name, nome_partial, masp, lotacao, validation_status, created_at, last_login')
    .in('validation_status', ['pending', 'approved', 'rejected'])
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const validations = (data || []).filter((user) => user.validation_status === 'pending');
  const summary = (data || []).reduce(
    (acc, user) => {
      if (user.validation_status === 'pending') acc.pending += 1;
      if (user.validation_status === 'approved') acc.approved += 1;
      if (user.validation_status === 'rejected') acc.rejected += 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0 }
  );

  return Response.json({
    configured: true,
    validations,
    summary,
    admin,
  });
}

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return Response.json({ error: 'Supabase não configurado' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const userId = typeof body?.userId === 'string' ? body.userId : '';
    const status = body?.status;

    if (!userId || !isValidationStatus(status) || status === 'pending') {
      return Response.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const { data, error } = await sb
      .from('user_accounts_852')
      .update({ validation_status: status })
      .eq('id', userId)
      .select('id, validation_status')
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, user: data, admin });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: message }, { status: 500 });
  }
}

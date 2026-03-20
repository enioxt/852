import { getCurrentAdmin } from '@/lib/admin-auth';
import { getSupabase, createIssue } from '@/lib/supabase';

function normalizeTag(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
      message: 'Supabase não configurado.',
    });
  }

  const { data, error } = await sb
    .from('reports_852')
    .select('*')
    .in('status', ['pending_human', 'published', 'deleted'])
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const pending = (data || []).filter((r) => r.status === 'pending_human');
  const summary = (data || []).reduce(
    (acc, r) => {
      if (r.status === 'pending_human') acc.pending += 1;
      if (r.status === 'published') acc.approved += 1;
      if (r.status === 'deleted') acc.rejected += 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0 }
  );

  return Response.json({
    configured: true,
    pendingReports: pending.map(r => ({
      ...r,
      messages: typeof r.messages === 'string' ? JSON.parse(r.messages) : r.messages,
    })),
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
    const reportId = typeof body?.reportId === 'string' ? body.reportId : '';
    const action = body?.action;

    if (!reportId || (action !== 'approve' && action !== 'reject')) {
      return Response.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'published' : 'deleted';

    // Update status
    const { data: report, error } = await sb
      .from('reports_852')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', reportId)
      .select('*')
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Auto-create issue ONLY if approved
    if (action === 'approve') {
      const metadataPayload = report.metadata || {};
      const tags = Array.isArray(metadataPayload.tags)
        ? metadataPayload.tags.filter((tag: unknown): tag is string => typeof tag === 'string' && tag.trim().length > 0)
        : [];
      const primaryTag = tags.length > 0 ? normalizeTag(tags[0]) : null;
      const summary = typeof metadataPayload.summary === 'string' ? metadataPayload.summary.trim() : '';

      if (primaryTag) {
        await createIssue(
          `Tema recorrente: ${toTitleCase(primaryTag)}`,
          summary || `Relato compartilhado apontou recorrência em ${primaryTag}.`,
          primaryTag,
          'ai_suggestion',
          reportId
        );
      }
    }

    return Response.json({ success: true, report, admin });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: message }, { status: 500 });
  }
}

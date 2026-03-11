import { saveReport, getReports, deleteReportServer } from '@/lib/supabase';
import { recordEvent } from '@/lib/telemetry';
import { getCurrentUser } from '@/lib/user-auth';
import { createInteractionHash, getIdentityKey } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const { conversationId, messages, reviewData, sessionHash, metadata } = await req.json();
    if (!conversationId || !Array.isArray(messages)) {
      return Response.json({ error: 'conversationId e messages são obrigatórios' }, { status: 400 });
    }

    const user = await getCurrentUser();
    const identityKey = getIdentityKey(sessionHash, user?.id);
    const interactionHash = createInteractionHash();

    const id = await saveReport(conversationId, messages, reviewData, identityKey || undefined, {
      ...(metadata && typeof metadata === 'object' ? metadata : {}),
      interactionHash,
      userEmail: user?.email || null,
      userDisplayName: user?.display_name || null,
      savedAt: new Date().toISOString(),
    });
    if (!id) return Response.json({ error: 'Supabase não configurado' }, { status: 503 });

    recordEvent({ event_type: 'report_shared', metadata: { reportId: id, conversationId, identityKey, interactionHash } });
    return Response.json({ id, identityKey, interactionHash });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const sessionHash = searchParams.get('sessionHash');
  const ownOnly = searchParams.get('ownOnly') === 'true';
  const identityKey = ownOnly ? getIdentityKey(sessionHash, user?.id) : null;
  const reports = await getReports(100, identityKey || undefined);
  return Response.json({ reports });
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return Response.json({ error: 'id é obrigatório' }, { status: 400 });
    const ok = await deleteReportServer(id);
    if (!ok) return Response.json({ error: 'Falha ao deletar' }, { status: 500 });

    recordEvent({ event_type: 'report_deleted', metadata: { reportId: id } });
    return Response.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

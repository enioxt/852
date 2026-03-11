import { saveReport, getReports, deleteReportServer } from '@/lib/supabase';
import { recordEvent } from '@/lib/telemetry';

export async function POST(req: Request) {
  try {
    const { conversationId, messages, reviewData, sessionHash } = await req.json();
    if (!conversationId || !Array.isArray(messages)) {
      return Response.json({ error: 'conversationId e messages são obrigatórios' }, { status: 400 });
    }
    const id = await saveReport(conversationId, messages, reviewData, sessionHash);
    if (!id) return Response.json({ error: 'Supabase não configurado' }, { status: 503 });

    recordEvent({ event_type: 'report_shared', metadata: { reportId: id, conversationId } });
    return Response.json({ id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const reports = await getReports();
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

import { saveReport, getReports, deleteReportServer, createIssue } from '@/lib/supabase';
import { recordEvent } from '@/lib/telemetry';
import { getCurrentUser } from '@/lib/user-auth';
import { createInteractionHash, getIdentityKey } from '@/lib/session';

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

export async function POST(req: Request) {
  try {
    const { conversationId, messages, reviewData, sessionHash, metadata } = await req.json();
    if (!conversationId || !Array.isArray(messages)) {
      return Response.json({ error: 'conversationId e messages são obrigatórios' }, { status: 400 });
    }

    const user = await getCurrentUser();
    const identityKey = getIdentityKey(sessionHash, user?.id);
    const interactionHash = createInteractionHash();
    const metadataPayload = metadata && typeof metadata === 'object' ? metadata as Record<string, unknown> : {};

    const id = await saveReport(conversationId, messages, reviewData, identityKey || undefined, {
      ...metadataPayload,
      interactionHash,
      userEmail: user?.email || null,
      userDisplayName: user?.display_name || null,
      savedAt: new Date().toISOString(),
    });
    if (!id) return Response.json({ error: 'Supabase não configurado' }, { status: 503 });

    const tags = Array.isArray(metadataPayload.tags)
      ? metadataPayload.tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
      : [];
    const primaryTag = tags.length > 0 ? normalizeTag(tags[0]) : null;
    const summary = typeof metadataPayload.summary === 'string' ? metadataPayload.summary.trim() : '';

    if (primaryTag) {
      await createIssue(
        `Tema recorrente: ${toTitleCase(primaryTag)}`,
        summary || `Relato compartilhado apontou recorrência em ${primaryTag}.`,
        primaryTag,
        'ai_suggestion',
      );
    }

    recordEvent({ event_type: 'report_shared', metadata: { reportId: id, conversationId, identityKey, interactionHash, primaryTag } });
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

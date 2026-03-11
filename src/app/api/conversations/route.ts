import { saveConversation, getConversations, getConversationCountSinceLastReport } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/user-auth';
import { summarizeConversation, saveConversationSummary } from '@/lib/conversation-memory';
import { createInteractionHash, getIdentityKey } from '@/lib/session';

const AI_REPORT_TRIGGER = 5;

export async function POST(req: Request) {
  try {
    const { messages, title, sessionHash, existingId, clientConversationId } = await req.json();
    if (!Array.isArray(messages)) {
      return Response.json({ error: 'messages é obrigatório' }, { status: 400 });
    }

    const user = await getCurrentUser();
    const identityKey = getIdentityKey(sessionHash, user?.id);
    const interactionHash = createInteractionHash();

    const id = await saveConversation(messages, title, identityKey || undefined, existingId, {
      clientConversationId: typeof clientConversationId === 'string' ? clientConversationId : null,
      interactionHash,
      lastSyncedAt: new Date().toISOString(),
      userEmail: user?.email || null,
      userDisplayName: user?.display_name || null,
    });

    if (!id) return Response.json({ error: 'Supabase não configurado' }, { status: 503 });

    const lastMessage = messages[messages.length - 1];
    const shouldRefreshSummary = messages.length >= 4 && lastMessage?.role === 'assistant' && (messages.length === 4 || messages.length % 6 === 0);

    if (shouldRefreshSummary) {
      const summary = await summarizeConversation(messages);
      if (summary) {
        await saveConversationSummary(id, summary);
      }
    }

    // Auto-report trigger: check every new conversation (not updates)
    let reportTriggered = false;
    if (!existingId) {
      const count = await getConversationCountSinceLastReport();
      if (count >= AI_REPORT_TRIGGER) {
        // Fire-and-forget: generate AI report in background
        const baseUrl = req.headers.get('origin') || req.headers.get('host') || '';
        const protocol = baseUrl.startsWith('http') ? '' : 'http://';
        fetch(`${protocol}${baseUrl}/api/ai-reports/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force: false }),
        }).catch(err => console.error('[852] auto-report trigger failed:', err.message));
        reportTriggered = true;
      }
    }

    return Response.json({ id, reportTriggered, identityKey, interactionHash });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const sessionHash = searchParams.get('sessionHash');
  const identityKey = getIdentityKey(sessionHash, user?.id);
  const convos = await getConversations(50, identityKey || undefined);
  return Response.json({ conversations: convos });
}

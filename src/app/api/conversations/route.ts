import { saveConversation, getConversations, getConversationCountSinceLastReport } from '@/lib/supabase';

const AI_REPORT_TRIGGER = 5;

export async function POST(req: Request) {
  try {
    const { messages, title, sessionHash, existingId } = await req.json();
    if (!Array.isArray(messages)) {
      return Response.json({ error: 'messages é obrigatório' }, { status: 400 });
    }
    const id = await saveConversation(messages, title, sessionHash, existingId);
    if (!id) return Response.json({ error: 'Supabase não configurado' }, { status: 503 });

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

    return Response.json({ id, reportTriggered });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const convos = await getConversations();
  return Response.json({ conversations: convos });
}

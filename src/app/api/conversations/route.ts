import { saveConversation, getConversations } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { messages, title, sessionHash, existingId } = await req.json();
    if (!Array.isArray(messages)) {
      return Response.json({ error: 'messages é obrigatório' }, { status: 400 });
    }
    const id = await saveConversation(messages, title, sessionHash, existingId);
    if (!id) return Response.json({ error: 'Supabase não configurado' }, { status: 503 });
    return Response.json({ id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const convos = await getConversations();
  return Response.json({ conversations: convos });
}

import { deleteUserConversations } from '@/lib/user-auth';

export async function DELETE() {
  try {
    const result = await deleteUserConversations();
    if ('error' in result) {
      return Response.json({ error: result.error }, { status: result.status ?? 500 });
    }
    return Response.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

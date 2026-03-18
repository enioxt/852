import { claimLegacyIdentity } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/user-auth';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return Response.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const { sessionHash } = await req.json();
    if (!sessionHash || typeof sessionHash !== 'string') {
      return Response.json({ error: 'sessionHash é obrigatório' }, { status: 400 });
    }

    const result = await claimLegacyIdentity(sessionHash, currentUser.id);
    return Response.json({
      success: true,
      userId: currentUser.id,
      ...result,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

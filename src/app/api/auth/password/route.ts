import { updateCurrentUserPassword } from '@/lib/user-auth';

export async function POST(req: Request) {
  try {
    const { currentPassword, newPassword } = await req.json();
    const result = await updateCurrentUserPassword({ currentPassword, newPassword });
    if ('error' in result) {
      return Response.json(result, { status: result.status || 400 });
    }
    return Response.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

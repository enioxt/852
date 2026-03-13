import { getCurrentUser, updateCurrentUserProfile } from '@/lib/user-auth';

export async function PATCH(req: Request) {
  try {
    const { displayName, masp, lotacao } = await req.json();
    const result = await updateCurrentUserProfile({ displayName, masp, lotacao });
    if ('error' in result) {
      return Response.json(result, { status: result.status || 400 });
    }
    return Response.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null }, { status: 401 });
  return Response.json({ user });
}

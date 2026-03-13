import { resetPasswordWithToken } from '@/lib/user-auth';

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();
    const result = await resetPasswordWithToken(String(token || ''), String(newPassword || ''));
    if ('error' in result) {
      return Response.json({ error: result.error }, { status: result.status || 400 });
    }

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: message }, { status: 500 });
  }
}

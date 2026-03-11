import { loginUser } from '@/lib/user-auth';
import { recordEvent } from '@/lib/telemetry';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return Response.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
    }

    const result = await loginUser(email, password);
    if (result.error) {
      return Response.json({ error: result.error }, { status: 401 });
    }

    recordEvent({ event_type: 'user_login', metadata: { userId: result.user?.id } });
    return Response.json({ user: result.user });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

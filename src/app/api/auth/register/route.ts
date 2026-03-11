import { registerUser } from '@/lib/user-auth';
import { recordEvent } from '@/lib/telemetry';

export async function POST(req: Request) {
  try {
    const { email, password, displayName, masp, lotacao } = await req.json();
    if (!email || !password) {
      return Response.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    }

    const result = await registerUser(email, password, displayName, masp, lotacao);
    if (result.error) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    recordEvent({ event_type: 'user_registered', metadata: { userId: result.user?.id } });
    return Response.json({ user: result.user });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

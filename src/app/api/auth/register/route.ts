import { registerUser } from '@/lib/user-auth';
import { recordEvent } from '@/lib/telemetry';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const REGISTER_LIMIT = { limit: 3, windowMs: 30 * 60 * 1000 };

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const rl = checkRateLimit(`register:${ip}`, REGISTER_LIMIT.limit, REGISTER_LIMIT.windowMs);
    if (!rl.allowed) {
      return Response.json(
        { error: 'Muitas tentativas de cadastro. Aguarde 30 minutos.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

    const { email, password, displayName, masp, lotacao } = await req.json();
    if (!email || !password) {
      return Response.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: 'Senha deve ter pelo menos 8 caracteres' }, { status: 400 });
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

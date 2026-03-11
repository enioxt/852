import { loginUser } from '@/lib/user-auth';
import { recordEvent } from '@/lib/telemetry';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const LOGIN_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const rl = checkRateLimit(`login:${ip}`, LOGIN_LIMIT.limit, LOGIN_LIMIT.windowMs);
    if (!rl.allowed) {
      recordEvent({ event_type: 'rate_limited', metadata: { endpoint: '/api/auth/login', ip } });
      return Response.json(
        { error: 'Muitas tentativas. Aguarde 15 minutos.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

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

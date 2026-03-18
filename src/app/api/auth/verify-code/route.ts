import { verifyEmailCode } from '@/lib/user-auth';
import { getClientIp, checkRateLimit } from '@/lib/rate-limit';
import { recordEvent } from '@/lib/telemetry';

const VERIFY_CODE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const rl = checkRateLimit(`verify-code:${ip}`, VERIFY_CODE_LIMIT.limit, VERIFY_CODE_LIMIT.windowMs);
    if (!rl.allowed) {
      recordEvent({ event_type: 'rate_limited', metadata: { endpoint: '/api/auth/verify-code', ip } });
      return Response.json(
        { error: 'Muitas tentativas. Aguarde 15 minutos.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

    const { email, code } = await req.json();
    if (!email || !code) {
      return Response.json({ error: 'Email e código obrigatórios' }, { status: 400 });
    }

    const baseUrl = new URL(req.url).origin;
    const result = await verifyEmailCode(String(email), String(code), { baseUrl });

    if ('error' in result) {
      return Response.json({ error: result.error }, { status: result.status ?? 401 });
    }

    return Response.json({
      user: result.user,
      isNewUser: result.isNewUser,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

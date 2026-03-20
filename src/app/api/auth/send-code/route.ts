import { sendEmailCode } from '@/lib/user-auth';
import { getClientIp, checkRateLimit } from '@/lib/rate-limit';
import { recordEvent } from '@/lib/telemetry';

const SEND_CODE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const rl = checkRateLimit(`send-code:${ip}`, SEND_CODE_LIMIT.limit, SEND_CODE_LIMIT.windowMs);
    if (!rl.allowed) {
      recordEvent({ event_type: 'rate_limit_hit', metadata: { endpoint: '/api/auth/send-code', ip } });
      return Response.json(
        { error: 'Muitas tentativas. Aguarde 15 minutos.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: 'Email obrigatório' }, { status: 400 });
    }

    const baseUrl = new URL(req.url).origin;
    const result = await sendEmailCode(String(email), { baseUrl, ip });

    if ('error' in result) {
      return Response.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return Response.json({
      sent: result.sent,
      warning: result.warning,
      debugCode: result.debugCode,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

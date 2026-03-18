import { resendVerificationEmail } from '@/lib/user-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const RESEND_LIMIT = { limit: 3, windowMs: 30 * 60 * 1000 };

export async function POST(req: Request) {
  try {
    const requestUrl = new URL(req.url);
    const ip = getClientIp(req.headers);
    const rl = checkRateLimit(`auth:resend-verification:${ip}`, RESEND_LIMIT.limit, RESEND_LIMIT.windowMs);
    if (!rl.allowed) {
      return Response.json(
        { error: 'Muitas tentativas. Aguarde 30 minutos para reenviar.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Email obrigatório' }, { status: 400 });
    }

    const result = await resendVerificationEmail(email, { baseUrl: requestUrl.origin });
    if (!result.success) {
      return Response.json({ error: result.error || 'Falha ao reenviar verificação' }, { status: result.status ?? 500 });
    }

    return Response.json({
      success: true,
      message: result.alreadyVerified
        ? 'Este email já está verificado.'
        : 'Se houver uma conta pendente para este email, um novo link foi emitido.',
      warning: result.warning,
      debugVerificationUrl: result.debugVerificationUrl,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

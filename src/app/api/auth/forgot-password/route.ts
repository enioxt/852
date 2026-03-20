import { requestPasswordReset } from '@/lib/user-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const FORGOT_PASSWORD_LIMIT = { limit: 3, windowMs: 15 * 60 * 1000 };

export async function POST(req: Request) {
  try {
    const requestUrl = new URL(req.url);
    const ip = getClientIp(req.headers);
    const rl = checkRateLimit(`forgot-password:${ip}`, FORGOT_PASSWORD_LIMIT.limit, FORGOT_PASSWORD_LIMIT.windowMs);
    if (!rl.allowed) {
      return Response.json(
        { error: 'Muitas solicitações. Aguarde alguns minutos para tentar novamente.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

    const { email } = await req.json();
    const result = await requestPasswordReset(String(email || ''), { baseUrl: requestUrl.origin });
    if (!result.success) {
      return Response.json({ error: result.error || 'Falha ao iniciar recuperação.' }, { status: result.status ?? 400 });
    }

    return Response.json({
      success: true,
      message: `Enviamos um link para criar ou redefinir sua senha para ${email}. Verifique sua caixa de entrada e spam.`,
      warning: result.warning,
      debugResetUrl: result.debugResetUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: message }, { status: 500 });
  }
}

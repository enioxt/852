import { validateDisplayName } from '@/lib/name-validator';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const rl = checkRateLimit(`name-validate:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return Response.json({ error: 'Muitas tentativas. Aguarde um minuto.' }, { status: 429 });
    }

    const { name } = await req.json();
    if (!name || typeof name !== 'string') {
      return Response.json({ error: 'Nome obrigatório' }, { status: 400 });
    }

    const result = await validateDisplayName(name);
    return Response.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

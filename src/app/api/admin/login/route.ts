import { login } from '@/lib/admin-auth';
import { getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const ipHash = getClientIp(req.headers);
    const result = await login(email, password, ipHash);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 401 });
    }

    return Response.json({ user: result.user });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

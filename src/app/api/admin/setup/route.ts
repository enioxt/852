import { createAdminUser } from '@/lib/admin-auth';

/**
 * POST /api/admin/setup — Create first admin user
 * Only works if no admin users exist yet (bootstrap endpoint)
 */
export async function POST(req: Request) {
  try {
    const { email, password, name, setupKey } = await req.json();

    // Require a setup key from env to prevent abuse
    const expectedKey = process.env.ADMIN_SETUP_KEY;
    if (!expectedKey || setupKey !== expectedKey) {
      return Response.json({ error: 'Setup key inválida' }, { status: 403 });
    }

    if (!email || !password) {
      return Response.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: 'Senha deve ter pelo menos 8 caracteres' }, { status: 400 });
    }

    const result = await createAdminUser(email, password, name);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ success: true, message: 'Admin criado com sucesso' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

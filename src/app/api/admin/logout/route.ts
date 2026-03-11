import { logout } from '@/lib/admin-auth';

export async function POST() {
  try {
    await logout();
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Erro ao sair' }, { status: 500 });
  }
}

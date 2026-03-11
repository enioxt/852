import { getDashboardStats } from '@/lib/supabase';
import { getCurrentAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
  // Require admin authentication
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '30', 10);

  const stats = await getDashboardStats(days);
  if (!stats) {
    return Response.json({ configured: false, message: 'Supabase não configurado' });
  }

  return Response.json({ configured: true, stats });
}

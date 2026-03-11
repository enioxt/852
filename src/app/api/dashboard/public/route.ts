import { getDashboardStats } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const stats = await getDashboardStats(days);

  if (!stats) {
    return Response.json({ configured: false, message: 'Supabase não configurado' });
  }

  return Response.json({ configured: true, stats });
}

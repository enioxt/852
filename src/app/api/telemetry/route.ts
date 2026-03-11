import { getStats } from '@/lib/telemetry';
import { getCurrentAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
  // Require admin authentication
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '7', 10);

  const stats = await getStats(days);

  if (!stats) {
    return new Response(JSON.stringify({
      configured: false,
      message: 'Supabase não configurado. Telemetria disponível apenas via docker logs.',
      hint: 'Adicione SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ao .env e execute migrations/001_telemetry_table.sql',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ configured: true, stats }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

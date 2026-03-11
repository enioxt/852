import { getLeaderboard } from '@/lib/gamification';

export const revalidate = 60;

export async function GET() {
  try {
    const entries = await getLeaderboard(30);
    return Response.json({ leaderboard: entries });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

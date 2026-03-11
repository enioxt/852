/**
 * 🏆 Gamification — 852 Inteligência
 *
 * Anonymous reputation system: points, ranks, leaderboard.
 * Police hierarchy themed ranks.
 */

import { getSupabase } from './supabase';

export const POINT_VALUES = {
  report_shared: 10,
  issue_created: 5,
  comment_added: 3,
  upvote_received: 1,
  daily_login: 1,
  report_ai_reviewed: 2,
} as const;

export type PointAction = keyof typeof POINT_VALUES;

export interface Rank {
  name: string;
  minPoints: number;
  color: string;
  icon: string;
}

export const RANKS: Rank[] = [
  { name: 'Recruta', minPoints: 0, color: 'neutral', icon: '🔰' },
  { name: 'Agente', minPoints: 10, color: 'blue', icon: '🔵' },
  { name: 'Investigador', minPoints: 50, color: 'green', icon: '🟢' },
  { name: 'Inspetor', minPoints: 150, color: 'purple', icon: '🟣' },
  { name: 'Delegado', minPoints: 500, color: 'amber', icon: '🟡' },
  { name: 'Comissário', minPoints: 1000, color: 'red', icon: '🔴' },
];

export function getRank(points: number): Rank {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (points >= r.minPoints) rank = r;
  }
  return rank;
}

export function getNextRank(points: number): Rank | null {
  const currentIndex = RANKS.findIndex(r => r === getRank(points));
  return currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;
}

export function getProgressToNextRank(points: number): number {
  const current = getRank(points);
  const next = getNextRank(points);
  if (!next) return 100;
  const range = next.minPoints - current.minPoints;
  const progress = points - current.minPoints;
  return Math.min(Math.round((progress / range) * 100), 100);
}

export async function awardPoints(userId: string, action: PointAction): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;

  const pts = POINT_VALUES[action];

  const { data, error } = await sb.rpc('increment_reputation_852', {
    target_user_id: userId,
    points_to_add: pts,
  });

  if (error) {
    // Fallback: direct update if RPC not available
    const { data: user } = await sb
      .from('user_accounts_852')
      .select('reputation_points')
      .eq('id', userId)
      .single();

    if (user) {
      const newPoints = (user.reputation_points || 0) + pts;
      await sb
        .from('user_accounts_852')
        .update({ reputation_points: newPoints })
        .eq('id', userId);
      return newPoints;
    }
    return 0;
  }

  return typeof data === 'number' ? data : pts;
}

export interface LeaderboardEntry {
  position: number;
  displayName: string;
  points: number;
  rank: Rank;
}

export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data } = await sb
    .from('user_accounts_852')
    .select('id, display_name, reputation_points')
    .gt('reputation_points', 0)
    .order('reputation_points', { ascending: false })
    .limit(limit);

  return (data || []).map((user, index) => ({
    position: index + 1,
    displayName: user.display_name || 'Anônimo',
    points: user.reputation_points || 0,
    rank: getRank(user.reputation_points || 0),
  }));
}

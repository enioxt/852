// ETHIK Token Distribution Engine — Mock data for MVP
// Will be replaced with Supabase queries when DB is connected

export interface Contributor {
  id: string;
  rank: number;
  displayName: string;
  githubUsername: string;
  walletAddress?: string;
  totalPoints: number;
  penaltyScore: number;
  sources: { commits: number; prs: number; stars: number; reports: number; referrals: number };
}

export interface EthikRules {
  penaltyThreshold: number;
  penaltyDecayDays: number;
  contestPolicy: string;
  distributionMethod: string;
}

export const ETHIK_RULES: EthikRules = {
  penaltyThreshold: 5,
  penaltyDecayDays: 90,
  contestPolicy: 'User contests are always accepted. No counter-reply. Truth is what matters.',
  distributionMethod: 'Proportional to total points at snapshot time.',
};

export const POINT_VALUES = {
  commit: 10,
  pr_merged: 50,
  issue_opened: 15,
  star: 5,
  chat_report: 20,
  referral: 30,
  bonus: 100,
};

// Mock leaderboard data for MVP
export const MOCK_LEADERBOARD: Contributor[] = [
  {
    id: '1', rank: 1, displayName: 'Agente Alpha', githubUsername: 'agent-alpha',
    walletAddress: '0x1a2b...3c4d', totalPoints: 2450, penaltyScore: 0,
    sources: { commits: 120, prs: 15, stars: 45, reports: 8, referrals: 12 },
  },
  {
    id: '2', rank: 2, displayName: 'Dev Omega', githubUsername: 'dev-omega',
    walletAddress: '0x5e6f...7g8h', totalPoints: 1890, penaltyScore: 0,
    sources: { commits: 85, prs: 22, stars: 30, reports: 5, referrals: 8 },
  },
  {
    id: '3', rank: 3, displayName: 'Contrib Zero', githubUsername: 'contrib-zero',
    totalPoints: 1340, penaltyScore: 2.5,
    sources: { commits: 60, prs: 8, stars: 20, reports: 15, referrals: 20 },
  },
  {
    id: '4', rank: 4, displayName: 'Builder MG', githubUsername: 'builder-mg',
    totalPoints: 980, penaltyScore: 0,
    sources: { commits: 45, prs: 5, stars: 15, reports: 10, referrals: 5 },
  },
  {
    id: '5', rank: 5, displayName: 'Policial Dev', githubUsername: 'policial-dev',
    totalPoints: 750, penaltyScore: 0,
    sources: { commits: 30, prs: 3, stars: 50, reports: 2, referrals: 3 },
  },
];

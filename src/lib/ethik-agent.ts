/**
 * ETHIK Agent — Core Controller
 * Manages tokenomics, donations, x402 payments, and EGOS points distribution.
 *
 * Fibonacci-based distribution:
 * - Initial score: F₁₂ = 144 points
 * - Period length: F₇ = 13 days
 * - Max points per action: F₂₁ = 21
 * - Tiers: F3 (3), F5 (5), F8 (8), F13 (13), F21 (21)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/* ─── Types ───────────────────────────────────────────────────────────────── */

export type ActionType =
  | 'chat_message' | 'report_shared' | 'issue_created' | 'issue_voted'
  | 'comment_posted' | 'suggestion_submitted' | 'donation_made'
  | 'token_purchased' | 'code_contribution' | 'bug_reported'
  | 'review_completed' | 'moderation_action';

export type Tier = 'F3' | 'F5' | 'F8' | 'F13' | 'F21';

export interface EthikPayment {
  tx_hash: string;
  chain: string;
  token: string;
  amount_raw: string;
  amount_usd: number;
  payer_address: string;
  api_endpoint: string;
  request_metadata?: Record<string, unknown>;
}

export interface EthikDonation {
  network: 'pix' | 'btc' | 'eth' | 'sol' | 'bnb' | 'base' | 'other';
  tx_hash?: string;
  amount_raw: string;
  amount_usd?: number;
  donor_address?: string;
  donor_name?: string;
}

export interface EthikScore {
  user_id: string;
  permanent_score: number;
  period_delta: number;
  tier: Tier;
  total_ethik_earned: number;
}

/* ─── Constants ───────────────────────────────────────────────────────────── */

const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610];
const INITIAL_SCORE = 144;    // F₁₂
const PERIOD_DAYS = 13;       // F₇
const MAX_POINTS = 21;        // F₂₁

const ACTION_POINTS: Record<ActionType, number> = {
  chat_message: 1,
  report_shared: 8,
  issue_created: 5,
  issue_voted: 2,
  comment_posted: 3,
  suggestion_submitted: 8,
  donation_made: 13,
  token_purchased: 13,
  code_contribution: 13,
  bug_reported: 5,
  review_completed: 5,
  moderation_action: 3,
};

const TIER_THRESHOLDS: Record<Tier, number> = {
  F3: 0,
  F5: 50,
  F8: 200,
  F13: 500,
  F21: 1000,
};

/* ─── ETHIK Token Constants ───────────────────────────────────────────────── */

export const ETHIK_TOKEN = {
  contract: '0x633b346b85c4877ace4d47f7aa72c2a092136cb5',
  chain: 'base',
  symbol: 'ETHIK',
  flaunchUrl: 'https://flaunch.gg/base/coins/0x633b346b85c4877ace4d47f7aa72c2a092136cb5',
};

export const DONATION_WALLETS = {
  pix: 'enioxt@gmail.com',
  btc: 'bc1qua6c3dqka9kqt73a3xgfperl6jmffsefcr0g7n',
  eth: '0x7f43b82a000a1977cc355c6e7ece166dfbb885ab',
  sol: 'Aw4BXasKPHN98HkqjcNKwD1ug5U6rmXo2GBGQWfhhSh4',
  bnb: '0x12e69a0d9571676f3e95007b99ce02b207adb4b0',
};

/* ─── Agent Class ─────────────────────────────────────────────────────────── */

export class EthikAgent {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /* ── Payments (x402) ──────────────────────────────────────────────────── */

  async recordPayment(payment: EthikPayment) {
    const { data, error } = await this.supabase
      .from('ethik_payments_852')
      .insert(payment)
      .select()
      .single();

    if (error) throw new Error(`Payment recording failed: ${error.message}`);
    return data;
  }

  async getRevenueStats(days = 30) {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data, error } = await this.supabase
      .from('ethik_payments_852')
      .select('amount_usd, api_endpoint, chain, created_at')
      .gte('created_at', since)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Revenue stats failed: ${error.message}`);

    const total = data?.reduce((sum, p) => sum + Number(p.amount_usd), 0) ?? 0;
    const byEndpoint = data?.reduce((acc, p) => {
      acc[p.api_endpoint] = (acc[p.api_endpoint] ?? 0) + Number(p.amount_usd);
      return acc;
    }, {} as Record<string, number>);

    return { total, transactions: data?.length ?? 0, byEndpoint, period: `${days}d` };
  }

  /* ── Donations ────────────────────────────────────────────────────────── */

  async recordDonation(donation: EthikDonation) {
    const { data, error } = await this.supabase
      .from('ethik_donations_852')
      .insert(donation)
      .select()
      .single();

    if (error) throw new Error(`Donation recording failed: ${error.message}`);
    return data;
  }

  async getDonationStats() {
    const { data, error } = await this.supabase
      .from('ethik_donations_852')
      .select('amount_usd, network, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Donation stats failed: ${error.message}`);

    const total = data?.reduce((sum, d) => sum + Number(d.amount_usd ?? 0), 0) ?? 0;
    return { total, count: data?.length ?? 0, donations: data };
  }

  /* ── EGOS Points ──────────────────────────────────────────────────────── */

  async awardPoints(userId: string, action: ActionType, referenceUrl?: string, metadata?: Record<string, unknown>) {
    const points = Math.min(ACTION_POINTS[action], MAX_POINTS);

    // Record action
    await this.supabase.from('ethik_actions_852').insert({
      user_id: userId,
      action_type: action,
      points,
      reference_url: referenceUrl,
      metadata: metadata ?? {},
    });

    // Upsert score
    const { data: existing } = await this.supabase
      .from('ethik_scores_852')
      .select('*')
      .eq('user_id', userId)
      .single();

    const currentScore = existing?.permanent_score ?? INITIAL_SCORE;
    const currentDelta = existing?.period_delta ?? 0;
    const newScore = currentScore + points;
    const newDelta = currentDelta + points;
    const newTier = this.calculateTier(newScore);

    const { error } = await this.supabase
      .from('ethik_scores_852')
      .upsert({
        user_id: userId,
        permanent_score: newScore,
        period_delta: newDelta,
        tier: newTier,
        updated_at: new Date().toISOString(),
      });

    if (error) throw new Error(`Points award failed: ${error.message}`);

    return { points, newScore, tier: newTier, delta: newDelta };
  }

  async getLeaderboard(limit = 20) {
    const { data, error } = await this.supabase
      .from('ethik_scores_852')
      .select('user_id, permanent_score, tier, total_ethik_earned')
      .order('permanent_score', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Leaderboard failed: ${error.message}`);
    return data;
  }

  /* ── Period Distribution ──────────────────────────────────────────────── */

  async getCurrentPeriod() {
    const { data } = await this.supabase
      .from('ethik_periods_852')
      .select('*')
      .eq('distributed', false)
      .order('period_number', { ascending: false })
      .limit(1)
      .single();

    return data;
  }

  async createNewPeriod(tokenPool: number) {
    const { data: lastPeriod } = await this.supabase
      .from('ethik_periods_852')
      .select('period_number')
      .order('period_number', { ascending: false })
      .limit(1)
      .single();

    const nextNumber = (lastPeriod?.period_number ?? 0) + 1;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + PERIOD_DAYS * 86400000);

    const { data, error } = await this.supabase
      .from('ethik_periods_852')
      .insert({
        period_number: nextNumber,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        token_pool: tokenPool,
      })
      .select()
      .single();

    if (error) throw new Error(`Period creation failed: ${error.message}`);
    return data;
  }

  /**
   * Distributes ETHIK tokens proportionally based on each user's period_delta.
   * Formula: user_tokens = (user_delta / total_delta) * token_pool
   */
  async distributePeriod(periodId: number) {
    // Get all users with positive delta
    const { data: scores } = await this.supabase
      .from('ethik_scores_852')
      .select('user_id, period_delta')
      .gt('period_delta', 0);

    if (!scores?.length) return { distributed: 0 };

    const totalDelta = scores.reduce((sum, s) => sum + s.period_delta, 0);

    const { data: period } = await this.supabase
      .from('ethik_periods_852')
      .select('token_pool')
      .eq('id', periodId)
      .single();

    if (!period) throw new Error('Period not found');

    const distributions = scores.map(s => ({
      user_id: s.user_id,
      tokens: (s.period_delta / totalDelta) * Number(period.token_pool),
    }));

    // Update each user's total_ethik_earned and reset period_delta
    for (const dist of distributions) {
      const { data: current } = await this.supabase
        .from('ethik_scores_852')
        .select('total_ethik_earned')
        .eq('user_id', dist.user_id)
        .single();

      await this.supabase
        .from('ethik_scores_852')
        .update({
          total_ethik_earned: Number(current?.total_ethik_earned ?? 0) + dist.tokens,
          period_delta: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', dist.user_id);
    }

    // Mark period as distributed
    await this.supabase
      .from('ethik_periods_852')
      .update({ distributed: true, total_delta: totalDelta })
      .eq('id', periodId);

    return { distributed: distributions.length, totalDelta, distributions };
  }

  /* ── Helpers ──────────────────────────────────────────────────────────── */

  private calculateTier(score: number): Tier {
    if (score >= TIER_THRESHOLDS.F21) return 'F21';
    if (score >= TIER_THRESHOLDS.F13) return 'F13';
    if (score >= TIER_THRESHOLDS.F8) return 'F8';
    if (score >= TIER_THRESHOLDS.F5) return 'F5';
    return 'F3';
  }

  /** Get Fibonacci number at index */
  static fib(n: number): number {
    return FIBONACCI[Math.min(n, FIBONACCI.length - 1)];
  }
}

/* ─── Singleton Factory ───────────────────────────────────────────────────── */

let _instance: EthikAgent | null = null;

export function getEthikAgent(): EthikAgent {
  if (!_instance) {
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    _instance = new EthikAgent(url, key);
  }
  return _instance;
}

/**
 * Analytics — 852 Inteligência
 *
 * Advanced analytics for engagement metrics:
 * - Retention (D1, D7, D30)
 * - Churn rate
 * - Average session duration
 * - Funnel conversion rates
 * - Cohort analysis
 */

import { getSupabase } from './supabase';

// Types
export interface RetentionMetrics {
  d1: number; // Day 1 retention (%)
  d7: number; // Day 7 retention (%)
  d30: number; // Day 30 retention (%)
  newUsers: number; // Users in cohort
  returningUsers: number; // Users who returned
}

export interface SessionMetrics {
  avgDurationMinutes: number;
  medianDurationMinutes: number;
  p95DurationMinutes: number;
  totalSessions: number;
  bounceRate: number; // Sessions < 30 seconds
}

export interface FunnelMetrics {
  landing: number;
  chat: number; // Started a chat
  reportReview: number; // Clicked report review
  shared: number; // Actually shared a report
  conversionRate: number; // landing → shared
}

export interface DailyStats {
  date: string;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  reportsShared: number;
  issuesCreated: number;
  commentsAdded: number;
  avgSessionDuration: number;
}

export interface CohortRow {
  cohortDate: string; // YYYY-MM-DD
  size: number;
  retention: number[]; // [D0=100%, D1, D2, ..., D30]
}

export interface EngagementSummary {
  retention: RetentionMetrics;
  sessions: SessionMetrics;
  funnel: FunnelMetrics;
  dailyStats: DailyStats[];
  cohorts: CohortRow[];
}

// Get retention metrics for a date range
export async function getRetentionMetrics(
  startDate: Date,
  endDate: Date
): Promise<RetentionMetrics> {
  const sb = getSupabase();
  if (!sb) {
    return { d1: 0, d7: 0, d30: 0, newUsers: 0, returningUsers: 0 };
  }

  // Get new users in the cohort period
  const { data: newUsers, error: newError } = await sb
    .from('user_accounts_852')
    .select('id, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (newError || !newUsers || newUsers.length === 0) {
    return { d1: 0, d7: 0, d30: 0, newUsers: 0, returningUsers: 0 };
  }

  const userIds = newUsers.map((u) => u.id);

  // Check D1 retention (returned within 1 day)
  const d1Date = new Date(startDate);
  d1Date.setDate(d1Date.getDate() + 1);
  const { data: d1Returns } = await sb
    .from('telemetry_852')
    .select('client_ip_hash')
    .in('client_ip_hash', userIds)
    .gte('created_at', endDate.toISOString())
    .lte('created_at', d1Date.toISOString())
    .limit(1);

  // Check D7 retention
  const d7Date = new Date(startDate);
  d7Date.setDate(d7Date.getDate() + 7);
  const { data: d7Returns } = await sb
    .from('telemetry_852')
    .select('client_ip_hash')
    .in('client_ip_hash', userIds)
    .gte('created_at', endDate.toISOString())
    .lte('created_at', d7Date.toISOString())
    .limit(1);

  // Check D30 retention
  const d30Date = new Date(startDate);
  d30Date.setDate(d30Date.getDate() + 30);
  const { data: d30Returns } = await sb
    .from('telemetry_852')
    .select('client_ip_hash')
    .in('client_ip_hash', userIds)
    .gte('created_at', endDate.toISOString())
    .lte('created_at', d30Date.toISOString())
    .limit(1);

  const total = userIds.length;

  return {
    d1: Math.round(((d1Returns?.length || 0) / total) * 100),
    d7: Math.round(((d7Returns?.length || 0) / total) * 100),
    d30: Math.round(((d30Returns?.length || 0) / total) * 100),
    newUsers: total,
    returningUsers: d30Returns?.length || 0,
  };
}

// Get session metrics
export async function getSessionMetrics(
  days = 30
): Promise<SessionMetrics> {
  const sb = getSupabase();
  if (!sb) {
    return {
      avgDurationMinutes: 0,
      medianDurationMinutes: 0,
      p95DurationMinutes: 0,
      totalSessions: 0,
      bounceRate: 0,
    };
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Get session events grouped by session
  const { data: sessions, error } = await sb.rpc('get_session_durations', {
    since_date: since.toISOString(),
  });

  if (error || !sessions || sessions.length === 0) {
    return {
      avgDurationMinutes: 0,
      medianDurationMinutes: 0,
      p95DurationMinutes: 0,
      totalSessions: 0,
      bounceRate: 0,
    };
  }

  // Calculate metrics
  const durations = sessions.map((s: { duration_seconds: number }) => s.duration_seconds / 60);
  const total = durations.length;
  const sum = durations.reduce((a: number, b: number) => a + b, 0);
  const avg = sum / total;

  // Sort for median and percentiles
  const sorted = [...durations].sort((a, b) => a - b);
  const median = sorted[Math.floor(total / 2)];
  const p95Index = Math.floor(total * 0.95);
  const p95 = sorted[p95Index] || sorted[sorted.length - 1];

  // Bounce rate: sessions < 30 seconds (0.5 min)
  const bounces = durations.filter((d: number) => d < 0.5).length;

  return {
    avgDurationMinutes: Math.round(avg * 10) / 10,
    medianDurationMinutes: Math.round(median * 10) / 10,
    p95DurationMinutes: Math.round(p95 * 10) / 10,
    totalSessions: total,
    bounceRate: Math.round((bounces / total) * 100),
  };
}

// Get funnel metrics
export async function getFunnelMetrics(days = 30): Promise<FunnelMetrics> {
  const sb = getSupabase();
  if (!sb) {
    return { landing: 0, chat: 0, reportReview: 0, shared: 0, conversionRate: 0 };
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Get landing page views (unique sessions)
  const { data: landing } = await sb
    .from('telemetry_852')
    .select('client_ip_hash')
    .eq('event_type', 'page_view')
    .gte('created_at', since.toISOString())
    .filter('metadata->>page', 'eq', '/');

  // Get chat starts
  const { data: chat } = await sb
    .from('telemetry_852')
    .select('client_ip_hash')
    .eq('event_type', 'chat_started')
    .gte('created_at', since.toISOString());

  // Get report review clicks
  const { data: reportReview } = await sb
    .from('telemetry_852')
    .select('client_ip_hash')
    .eq('event_type', 'report_review_opened')
    .gte('created_at', since.toISOString());

  // Get actual shares
  const { data: shared } = await sb
    .from('telemetry_852')
    .select('client_ip_hash')
    .eq('event_type', 'report_shared')
    .gte('created_at', since.toISOString());

  // Count unique sessions
  const landingCount = new Set(landing?.map((e) => e.client_ip_hash)).size;
  const chatCount = new Set(chat?.map((e) => e.client_ip_hash)).size;
  const reviewCount = new Set(reportReview?.map((e) => e.client_ip_hash)).size;
  const sharedCount = new Set(shared?.map((e) => e.client_ip_hash)).size;

  const conversionRate = landingCount > 0 ? Math.round((sharedCount / landingCount) * 100) : 0;

  return {
    landing: landingCount,
    chat: chatCount,
    reportReview: reviewCount,
    shared: sharedCount,
    conversionRate,
  };
}

// Get daily stats for the last N days
export async function getDailyStats(days = 30): Promise<DailyStats[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const result: DailyStats[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    // Active users (unique)
    const { data: active } = await sb
      .from('telemetry_852')
      .select('client_ip_hash')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    // New users
    const { data: newUsers } = await sb
      .from('user_accounts_852')
      .select('id')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    // Reports shared
    const { data: reports } = await sb
      .from('telemetry_852')
      .select('id')
      .eq('event_type', 'report_shared')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    // Issues created
    const { data: issues } = await sb
      .from('telemetry_852')
      .select('id')
      .eq('event_type', 'issue_created')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    // Comments
    const { data: comments } = await sb
      .from('telemetry_852')
      .select('id')
      .eq('event_type', 'comment_added')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    // Calculate avg session duration for the day
    const { data: sessions } = await sb.rpc('get_session_durations_for_date', {
      target_date: startOfDay.toISOString(),
    });

    const avgDuration = sessions?.length
      ? sessions.reduce((sum: number, s: { duration_seconds: number }) => sum + s.duration_seconds, 0) /
        sessions.length /
        60
      : 0;

    result.push({
      date: startOfDay.toISOString().split('T')[0],
      activeUsers: new Set(active?.map((e) => e.client_ip_hash)).size,
      newUsers: newUsers?.length || 0,
      returningUsers: 0, // Calculated separately
      reportsShared: reports?.length || 0,
      issuesCreated: issues?.length || 0,
      commentsAdded: comments?.length || 0,
      avgSessionDuration: Math.round(avgDuration * 10) / 10,
    });
  }

  return result;
}

// Get cohort analysis
export async function getCohortAnalysis(days = 30): Promise<CohortRow[]> {
  const sb = getSupabase();
  if (!sb) return [];

  // Get daily cohorts for the last N days
  const cohorts: CohortRow[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    // Get users who joined on this day
    const { data: cohortUsers } = await sb
      .from('user_accounts_852')
      .select('id')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (!cohortUsers || cohortUsers.length === 0) {
      cohorts.push({
        cohortDate: dateStr,
        size: 0,
        retention: [100, 0, 0, 0, 0, 0, 0],
      });
      continue;
    }

    const userIds = cohortUsers.map((u) => u.id);
    const size = userIds.length;

    // Calculate retention for D0-D7
    const retention: number[] = [100]; // D0 is always 100%

    for (let d = 1; d <= 7; d++) {
      const checkDate = new Date(startOfDay);
      checkDate.setDate(checkDate.getDate() + d);
      const checkEnd = new Date(checkDate);
      checkEnd.setHours(23, 59, 59, 999);

      const { data: returned } = await sb
        .from('telemetry_852')
        .select('client_ip_hash')
        .in('client_ip_hash', userIds)
        .gte('created_at', checkDate.toISOString())
        .lte('created_at', checkEnd.toISOString())
        .limit(1);

      const rate = Math.round(((returned?.length || 0) / size) * 100);
      retention.push(rate);
    }

    cohorts.push({
      cohortDate: dateStr,
      size,
      retention,
    });
  }

  return cohorts;
}

// Get complete engagement summary
export async function getEngagementSummary(
  days = 30
): Promise<EngagementSummary> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [retention, sessions, funnel, dailyStats, cohorts] = await Promise.all([
    getRetentionMetrics(since, new Date()),
    getSessionMetrics(days),
    getFunnelMetrics(days),
    getDailyStats(days),
    getCohortAnalysis(days),
  ]);

  return {
    retention,
    sessions,
    funnel,
    dailyStats,
    cohorts,
  };
}

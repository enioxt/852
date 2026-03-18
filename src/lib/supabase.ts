/**
 * 🗄️ Supabase Client — 852 Inteligência
 *
 * Shared Supabase client for server-side operations.
 * Uses service role key for full access to all tables.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getIdentityKey } from '@/lib/session';

let _sb: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_sb) return _sb;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _sb = createClient(url, key);
  return _sb;
}

function mergeMetadata(
  current: Record<string, unknown> | null | undefined,
  incoming: Record<string, unknown> | null | undefined
) {
  return {
    ...(current || {}),
    ...(incoming || {}),
  };
}

// ── Conversations ────────────────────────────────────────

export interface ConversationRecord {
  id: string;
  created_at: string;
  updated_at: string;
  session_hash: string | null;
  title: string | null;
  message_count: number;
  messages: Array<{ role: string; content: string; createdAt?: string }>;
  metadata: Record<string, unknown> | null;
}

export async function saveConversation(
  messages: Array<{ role: string; content: string }>,
  title?: string,
  sessionHash?: string,
  existingId?: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const payload = {
    messages: JSON.stringify(messages),
    message_count: messages.length,
    title: title || null,
    session_hash: sessionHash || null,
    updated_at: new Date().toISOString(),
  };

  if (existingId) {
    const { data: current } = await sb
      .from('conversations_852')
      .select('metadata')
      .eq('id', existingId)
      .maybeSingle();

    const { error } = await sb
      .from('conversations_852')
      .update({
        ...payload,
        metadata: mergeMetadata(current?.metadata as Record<string, unknown> | null, metadata),
      })
      .eq('id', existingId);
    if (error) { console.error('[852-supabase] save conv error:', error.message); return null; }
    return existingId;
  }

  const { data, error } = await sb
    .from('conversations_852')
    .insert({ ...payload, created_at: new Date().toISOString(), metadata: metadata || null })
    .select('id')
    .single();

  if (error) { console.error('[852-supabase] create conv error:', error.message); return null; }
  return data?.id || null;
}

export async function getConversations(limit = 50, identityKey?: string): Promise<ConversationRecord[]> {
  const sb = getSupabase();
  if (!sb) return [];

  let query = sb
    .from('conversations_852')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (identityKey) {
    query = query.eq('session_hash', identityKey);
  }

  const { data, error } = await query;

  if (error) return [];
  return (data || []).map(d => ({ ...d, messages: typeof d.messages === 'string' ? JSON.parse(d.messages) : d.messages }));
}

// ── Reports ──────────────────────────────────────────────

export interface ReportRecord {
  id: string;
  created_at: string;
  updated_at: string;
  conversation_id: string;
  status: string;
  messages: Array<{ role: string; content: string }>;
  review_data: Record<string, unknown> | null;
  session_hash: string | null;
  metadata: Record<string, unknown> | null;
}

export async function saveReport(
  conversationId: string,
  messages: Array<{ role: string; content: string }>,
  reviewData?: Record<string, unknown>,
  sessionHash?: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('reports_852')
    .insert({
      conversation_id: conversationId,
      messages: JSON.stringify(messages),
      review_data: reviewData || null,
      status: 'shared',
      session_hash: sessionHash || null,
      metadata: metadata || null,
    })
    .select('id')
    .single();

  if (error) { console.error('[852-supabase] save report error:', error.message); return null; }
  return data?.id || null;
}

export async function getReports(limit = 50, identityKey?: string): Promise<ReportRecord[]> {
  const sb = getSupabase();
  if (!sb) return [];

  let query = sb
    .from('reports_852')
    .select('*')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (identityKey) {
    query = query.eq('session_hash', identityKey);
  }

  const { data, error } = await query;

  if (error) return [];
  return (data || []).map(d => ({
    ...d,
    messages: typeof d.messages === 'string' ? JSON.parse(d.messages) : d.messages,
  }));
}

export async function deleteReportServer(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('reports_852')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', id);

  return !error;
}

export async function claimLegacyIdentity(sessionHash: string, userId: string): Promise<{
  claimedConversations: number;
  claimedReports: number;
  claimedVotes: number;
  dedupedVotes: number;
}> {
  const sb = getSupabase();
  if (!sb || !sessionHash || !userId) {
    return { claimedConversations: 0, claimedReports: 0, claimedVotes: 0, dedupedVotes: 0 };
  }

  const anonymousIdentity = getIdentityKey(sessionHash, null);
  const userIdentity = getIdentityKey(null, userId);
  if (!anonymousIdentity || !userIdentity || anonymousIdentity === userIdentity) {
    return { claimedConversations: 0, claimedReports: 0, claimedVotes: 0, dedupedVotes: 0 };
  }

  const now = new Date().toISOString();

  const { data: claimedConversationRows } = await sb
    .from('conversations_852')
    .update({ session_hash: userIdentity, updated_at: now })
    .eq('session_hash', anonymousIdentity)
    .select('id');

  const { data: claimedReportRows } = await sb
    .from('reports_852')
    .update({ session_hash: userIdentity, updated_at: now })
    .eq('session_hash', anonymousIdentity)
    .select('id');

  const { data: legacyVotes } = await sb
    .from('issue_votes_852')
    .select('id, issue_id')
    .eq('session_hash', anonymousIdentity);

  let claimedVotes = 0;
  let dedupedVotes = 0;

  for (const vote of legacyVotes || []) {
    const { data: existingUserVote } = await sb
      .from('issue_votes_852')
      .select('id')
      .eq('issue_id', vote.issue_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingUserVote?.id) {
      await sb.from('issue_votes_852').delete().eq('id', vote.id);
      dedupedVotes += 1;
      continue;
    }

    const { error } = await sb
      .from('issue_votes_852')
      .update({ user_id: userId, session_hash: userIdentity })
      .eq('id', vote.id);

    if (!error) claimedVotes += 1;
  }

  return {
    claimedConversations: claimedConversationRows?.length || 0,
    claimedReports: claimedReportRows?.length || 0,
    claimedVotes,
    dedupedVotes,
  };
}

// ── Issues (GitHub-like anonymous) ───────────────────────

export interface IssueRecord {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  body: string | null;
  status: string;
  category: string | null;
  source: string;
  ai_report_id: string | null;
  votes: number;
  comment_count: number;
}

export async function createIssue(
  title: string,
  body?: string,
  category?: string,
  source: string = 'user',
  aiReportId?: string
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  if (source === 'ai_suggestion') {
    const { data: existing } = await sb
      .from('issues_852')
      .select('id, status, ai_report_id')
      .eq('source', 'ai_suggestion')
      .eq('title', title)
      .in('status', ['open', 'in_discussion', 'resolved'])
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      await sb
        .from('issues_852')
        .update({
          updated_at: new Date().toISOString(),
          ai_report_id: aiReportId || existing.ai_report_id || null,
          status: existing.status === 'closed' ? 'open' : existing.status,
        })
        .eq('id', existing.id);

      if (body) {
        await addIssueComment(existing.id, `Tema recorrente identificado novamente em relatório de inteligência: ${body}`, true);
      }

      return existing.id;
    }
  }

  const { data, error } = await sb
    .from('issues_852')
    .insert({ title, body: body || null, category: category || null, source, ai_report_id: aiReportId || null })
    .select('id')
    .single();

  if (error) { console.error('[852-supabase] create issue error:', error.message); return null; }
  return data?.id || null;
}

export async function getIssues(
  status?: string,
  limit = 50,
  sortBy: 'votes' | 'created_at' = 'created_at',
  aiReportId?: string
): Promise<IssueRecord[]> {
  const sb = getSupabase();
  if (!sb) return [];

  let query = sb.from('issues_852').select('*').limit(limit);
  if (status) query = query.eq('status', status);
  if (aiReportId) query = query.eq('ai_report_id', aiReportId);
  query = query.order(sortBy, { ascending: false });

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

export async function voteIssue(
  issueId: string,
  sessionHash: string,
  userId?: string
): Promise<{ voted: boolean; issue?: { id: string; title: string | null; votes: number } }> {
  const sb = getSupabase();
  if (!sb) return { voted: false };

  const normalizedSessionHash = sessionHash.trim();
  const identitySessionHash = userId ? `user:${userId}` : normalizedSessionHash;
  if (!identitySessionHash) return { voted: false };

  if (userId) {
    const { data: existingByUser } = await sb
      .from('issue_votes_852')
      .select('id')
      .eq('issue_id', issueId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingByUser?.id) return { voted: false };

    const { data: existingByIdentityHash } = await sb
      .from('issue_votes_852')
      .select('id')
      .eq('issue_id', issueId)
      .eq('session_hash', identitySessionHash)
      .maybeSingle();

    if (existingByIdentityHash?.id) return { voted: false };

    if (normalizedSessionHash) {
      const { data: existingBySession } = await sb
        .from('issue_votes_852')
        .select('id, user_id')
        .eq('issue_id', issueId)
        .eq('session_hash', normalizedSessionHash)
        .maybeSingle();

      if (existingBySession?.id) {
        if (!existingBySession.user_id) {
          await sb
            .from('issue_votes_852')
            .update({ user_id: userId, session_hash: identitySessionHash })
            .eq('id', existingBySession.id);
        }
        return { voted: false };
      }
    }
  }

  // Try to insert vote (unique constraint prevents double votes)
  const { error } = await sb
    .from('issue_votes_852')
    .insert({
      issue_id: issueId,
      session_hash: identitySessionHash,
      user_id: userId || null,
    });

  if (error) return { voted: false };

  // Increment vote count (manual since no RPC function)
  const { data: issueData } = await sb.from('issues_852').select('title, votes').eq('id', issueId).single();
  if (issueData) {
    const updatedVotes = (issueData.votes || 0) + 1;
    await sb.from('issues_852').update({ votes: updatedVotes }).eq('id', issueId);
    return {
      voted: true,
      issue: {
        id: issueId,
        title: issueData.title || null,
        votes: updatedVotes,
      },
    };
  }

  return { voted: true };
}

export async function addIssueComment(
  issueId: string,
  body: string,
  isAi: boolean = false
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('issue_comments_852')
    .insert({ issue_id: issueId, body, is_ai: isAi })
    .select('id')
    .single();

  if (error) return null;

  // Increment comment count
  await sb.from('issues_852').select('comment_count').eq('id', issueId).single().then(({ data: issue }) => {
    if (issue) sb.from('issues_852').update({ comment_count: (issue.comment_count || 0) + 1, updated_at: new Date().toISOString() }).eq('id', issueId);
  });

  return data?.id || null;
}

export async function getIssueComments(issueId: string): Promise<Array<{ id: string; created_at: string; body: string; is_ai: boolean }>> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data } = await sb
    .from('issue_comments_852')
    .select('id, created_at, body, is_ai')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: true });

  return data || [];
}

// ── AI Reports ───────────────────────────────────────────

export interface AIReportRecord {
  id: string;
  created_at: string;
  trigger_type: string;
  model_id: string;
  provider: string;
  tokens_in: number | null;
  tokens_out: number | null;
  cost_usd: number | null;
  duration_ms: number | null;
  conversation_count: number;
  report_count: number;
  content_html: string;
  content_summary: string | null;
  insights: Record<string, unknown> | null;
  pending_topics: Array<Record<string, unknown>> | null;
  metadata: Record<string, unknown> | null;
}

export interface AIReportWithIssues extends AIReportRecord {
  issue_count: number;
  related_issues: IssueRecord[];
}

export async function saveAIReport(report: Omit<AIReportRecord, 'id' | 'created_at'>): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('ai_reports_852')
    .insert(report)
    .select('id')
    .single();

  if (error) { console.error('[852-supabase] save ai report error:', error.message); return null; }
  return data?.id || null;
}

export async function getAIReports(limit = 10): Promise<AIReportRecord[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('ai_reports_852')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}

export async function getAIReportsWithIssues(limit = 10): Promise<AIReportWithIssues[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const reports = await getAIReports(limit);
  if (reports.length === 0) return [];

  const reportIds = reports.map((report) => report.id);
  const { data: issues } = await sb
    .from('issues_852')
    .select('*')
    .in('ai_report_id', reportIds)
    .order('votes', { ascending: false });

  const relatedIssues = issues || [];

  return reports.map((report) => ({
    ...report,
    issue_count: relatedIssues.filter((issue) => issue.ai_report_id === report.id).length,
    related_issues: relatedIssues.filter((issue) => issue.ai_report_id === report.id),
  }));
}

export async function getLatestAIReport(): Promise<AIReportRecord | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data } = await sb
    .from('ai_reports_852')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data || null;
}

// ── Public Stats ─────────────────────────────────────────

export interface PublicStats {
  totalConversations: number;
  totalReportsShared: number;
  totalReportsReviewedByAI: number;
  totalIssuesOpen: number;
  totalAIReports: number;
  sharedReportsSinceLastAIReport: number;
  latestAIReport: AIReportRecord | null;
  recentIssues: IssueRecord[];
  recentReports: Array<{ id: string; created_at: string; conversation_id: string; status: string }>;
}

export async function getPublicStats(): Promise<PublicStats | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const [convos, reports, reviewedReports, issues, aiReports, latestAI, recentIssues, recentReportsData, sharedReportsSinceLastAIReport] = await Promise.all([
      sb.from('conversations_852').select('id', { count: 'exact', head: true }),
      sb.from('reports_852').select('id', { count: 'exact', head: true }).neq('status', 'deleted'),
      sb.from('reports_852').select('id', { count: 'exact', head: true }).neq('status', 'deleted').not('review_data', 'is', null),
      sb.from('issues_852').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      sb.from('ai_reports_852').select('id', { count: 'exact', head: true }),
      sb.from('ai_reports_852').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      sb.from('issues_852').select('*').in('status', ['open', 'in_discussion']).order('votes', { ascending: false }).limit(5),
      sb.from('reports_852').select('id, created_at, conversation_id, status').neq('status', 'deleted').order('created_at', { ascending: false }).limit(5),
      getSharedReportCountSinceLastAIReport(),
    ]);

    return {
      totalConversations: convos.count || 0,
      totalReportsShared: reports.count || 0,
      totalReportsReviewedByAI: reviewedReports.count || 0,
      totalIssuesOpen: issues.count || 0,
      totalAIReports: aiReports.count || 0,
      sharedReportsSinceLastAIReport,
      latestAIReport: latestAI.data || null,
      recentIssues: recentIssues.data || [],
      recentReports: recentReportsData.data || [],
    };
  } catch (e) {
    console.error('[852-supabase] public stats error:', e);
    return null;
  }
}

// ── AI Report Trigger Counts ─────────────────────────────

export async function getConversationCountSinceLastReport(): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;

  // Get last AI report timestamp
  const { data: lastReport } = await sb
    .from('ai_reports_852')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let query = sb.from('conversations_852').select('id', { count: 'exact', head: true });
  if (lastReport?.created_at) {
    query = query.gte('created_at', lastReport.created_at);
  }

  const { count } = await query;
  return count || 0;
}

export async function getSharedReportCountSinceLastAIReport(): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;

  const { data: lastReport } = await sb
    .from('ai_reports_852')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let query = sb
    .from('reports_852')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'deleted');

  if (lastReport?.created_at) {
    query = query.gte('created_at', lastReport.created_at);
  }

  const { count } = await query;
  return count || 0;
}

// ── Dashboard Stats ──────────────────────────────────────

export interface DashboardStats {
  totalConversations: number;
  totalReports: number;
  totalMessages: number;
  reportsShared: number;
  avgMessagesPerConversation: number;
  conversationsByDay: Array<{ day: string; count: number }>;
  reportsByDay: Array<{ day: string; count: number }>;
  topThemes: Array<{ theme: string; count: number }>;
  issuesByCategory: Array<{ category: string; count: number }>;
  recentReports: Array<{ id: string; created_at: string; snippet: string; themes: string[] }>;
}

export async function getDashboardStats(days = 30): Promise<DashboardStats | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Conversations
    const { data: convos } = await sb
      .from('conversations_852')
      .select('id, created_at, message_count')
      .gte('created_at', since);

    // Reports
    const { data: reports } = await sb
      .from('reports_852')
      .select('id, created_at, status, review_data, messages')
      .gte('created_at', since);

    const { data: issues } = await sb
      .from('issues_852')
      .select('category, created_at')
      .gte('created_at', since);

    const convoList = convos || [];
    const reportList = reports || [];
    const issueList = issues || [];

    // Conversations by day
    const convosByDay = new Map<string, number>();
    for (const c of convoList) {
      const day = c.created_at.slice(0, 10);
      convosByDay.set(day, (convosByDay.get(day) || 0) + 1);
    }

    // Reports by day
    const reportsByDay = new Map<string, number>();
    for (const r of reportList) {
      const day = r.created_at.slice(0, 10);
      reportsByDay.set(day, (reportsByDay.get(day) || 0) + 1);
    }

    // Theme extraction from review_data
    const themeCounts = new Map<string, number>();
    for (const r of reportList) {
      if (r.review_data && Array.isArray(r.review_data.temas)) {
        for (const t of r.review_data.temas) {
          themeCounts.set(t, (themeCounts.get(t) || 0) + 1);
        }
      }
    }

    const categoryCounts = new Map<string, number>();
    for (const issue of issueList) {
      const category = issue.category || 'outros';
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }

    const totalMessages = convoList.reduce((sum, c) => sum + (c.message_count || 0), 0);

    return {
      totalConversations: convoList.length,
      totalReports: reportList.length,
      totalMessages,
      reportsShared: reportList.filter(r => r.status === 'shared').length,
      avgMessagesPerConversation: convoList.length > 0 ? Math.round(totalMessages / convoList.length) : 0,
      conversationsByDay: Array.from(convosByDay.entries())
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => a.day.localeCompare(b.day)),
      reportsByDay: Array.from(reportsByDay.entries())
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => a.day.localeCompare(b.day)),
      topThemes: Array.from(themeCounts.entries())
        .map(([theme, count]) => ({ theme, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      issuesByCategory: Array.from(categoryCounts.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      recentReports: reportList
        .slice()
        .sort((a, b) => a.created_at.localeCompare(b.created_at) * -1)
        .slice(0, 6)
        .map((report) => {
          const reportMessages = Array.isArray(report.messages)
            ? report.messages
            : typeof report.messages === 'string'
              ? JSON.parse(report.messages)
              : [];
          const firstUserMessage = reportMessages.find((message: { role?: string; content?: string }) => message.role === 'user');
          const themes = report.review_data && Array.isArray(report.review_data.temas)
            ? report.review_data.temas as string[]
            : [];

          return {
            id: report.id,
            created_at: report.created_at,
            snippet: typeof firstUserMessage?.content === 'string'
              ? firstUserMessage.content.slice(0, 160)
              : 'Relato compartilhado sem resumo disponível.',
            themes: themes.slice(0, 3),
          };
        }),
    };
  } catch (e) {
    console.error('[852-supabase] dashboard stats error:', e);
    return null;
  }
}

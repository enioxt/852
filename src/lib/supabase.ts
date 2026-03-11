/**
 * 🗄️ Supabase Client — 852 Inteligência
 *
 * Shared Supabase client for server-side operations.
 * Uses service role key for full access to all tables.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _sb: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_sb) return _sb;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _sb = createClient(url, key);
  return _sb;
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
  existingId?: string
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
    const { error } = await sb
      .from('conversations_852')
      .update(payload)
      .eq('id', existingId);
    if (error) { console.error('[852-supabase] save conv error:', error.message); return null; }
    return existingId;
  }

  const { data, error } = await sb
    .from('conversations_852')
    .insert({ ...payload, created_at: new Date().toISOString() })
    .select('id')
    .single();

  if (error) { console.error('[852-supabase] create conv error:', error.message); return null; }
  return data?.id || null;
}

export async function getConversations(limit = 50): Promise<ConversationRecord[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('conversations_852')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

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
  sessionHash?: string
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
    })
    .select('id')
    .single();

  if (error) { console.error('[852-supabase] save report error:', error.message); return null; }
  return data?.id || null;
}

export async function getReports(limit = 50): Promise<ReportRecord[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('reports_852')
    .select('*')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .limit(limit);

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
  source_report_id: string | null;
  votes: number;
  comment_count: number;
  metadata: Record<string, unknown> | null;
}

export async function createIssue(
  title: string,
  body?: string,
  category?: string,
  source: string = 'user',
  sourceReportId?: string
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('issues_852')
    .insert({ title, body: body || null, category: category || null, source, source_report_id: sourceReportId || null })
    .select('id')
    .single();

  if (error) { console.error('[852-supabase] create issue error:', error.message); return null; }
  return data?.id || null;
}

export async function getIssues(
  status?: string,
  limit = 50,
  sortBy: 'votes' | 'created_at' = 'created_at'
): Promise<IssueRecord[]> {
  const sb = getSupabase();
  if (!sb) return [];

  let query = sb.from('issues_852').select('*').limit(limit);
  if (status) query = query.eq('status', status);
  query = query.order(sortBy, { ascending: false });

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

export async function voteIssue(issueId: string, sessionHash: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  // Try to insert vote (unique constraint prevents double votes)
  const { error } = await sb
    .from('issue_votes_852')
    .insert({ issue_id: issueId, session_hash: sessionHash });

  if (error) return false; // Already voted or other error

  // Increment vote count (manual since no RPC function)
  const { data: issueData } = await sb.from('issues_852').select('votes').eq('id', issueId).single();
  if (issueData) {
    await sb.from('issues_852').update({ votes: (issueData.votes || 0) + 1 }).eq('id', issueId);
  }

  return true;
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
  pending_topics: Array<{ title: string; category?: string; source_report_id?: string }> | null;
  metadata: Record<string, unknown> | null;
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
  totalIssuesOpen: number;
  totalAIReports: number;
  latestAIReport: AIReportRecord | null;
  recentIssues: IssueRecord[];
  recentReports: Array<{ id: string; created_at: string; conversation_id: string; status: string }>;
}

export async function getPublicStats(): Promise<PublicStats | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const [convos, reports, issues, aiReports, latestAI, recentIssues, recentReportsData] = await Promise.all([
      sb.from('conversations_852').select('id', { count: 'exact', head: true }),
      sb.from('reports_852').select('id', { count: 'exact', head: true }).neq('status', 'deleted'),
      sb.from('issues_852').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      sb.from('ai_reports_852').select('id', { count: 'exact', head: true }),
      sb.from('ai_reports_852').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      sb.from('issues_852').select('*').in('status', ['open', 'in_discussion']).order('votes', { ascending: false }).limit(5),
      sb.from('reports_852').select('id, created_at, conversation_id, status').neq('status', 'deleted').order('created_at', { ascending: false }).limit(5),
    ]);

    return {
      totalConversations: convos.count || 0,
      totalReportsShared: reports.count || 0,
      totalIssuesOpen: issues.count || 0,
      totalAIReports: aiReports.count || 0,
      latestAIReport: latestAI.data || null,
      recentIssues: recentIssues.data || [],
      recentReports: recentReportsData.data || [],
    };
  } catch (e) {
    console.error('[852-supabase] public stats error:', e);
    return null;
  }
}

// ── Conversation Count for Auto-Report Trigger ───────────

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
      .select('id, created_at, status, review_data')
      .gte('created_at', since);

    const convoList = convos || [];
    const reportList = reports || [];

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
    };
  } catch (e) {
    console.error('[852-supabase] dashboard stats error:', e);
    return null;
  }
}

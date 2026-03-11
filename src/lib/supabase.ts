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

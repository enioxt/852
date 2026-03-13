import { getSupabase, type IssueRecord } from '@/lib/supabase';

export interface CorrelatedReport {
  id: string;
  created_at: string;
  conversation_id: string;
  snippet: string;
  themes: string[];
}

export interface CorrelationResult {
  issues: IssueRecord[];
  reports: CorrelatedReport[];
}

export async function searchIssuesAndReports(
  searchTerms: string[],
  limit = 10
): Promise<CorrelationResult> {
  const sb = getSupabase();
  if (!sb || searchTerms.length === 0) {
    return { issues: [], reports: [] };
  }

  try {
    // Search issues by matching title or body against any of the search terms
    // Use ilike for flexible matching (no full-text search index needed)
    const issuePromises = searchTerms.slice(0, 6).map((term) =>
      sb
        .from('issues_852')
        .select('id, created_at, updated_at, title, body, status, category, source, ai_report_id, votes, comment_count')
        .or(`title.ilike.%${term}%,body.ilike.%${term}%`)
        .in('status', ['open', 'in_discussion', 'resolved'])
        .order('votes', { ascending: false })
        .limit(5)
    );

    const reportPromises = searchTerms.slice(0, 4).map((term) =>
      sb
        .from('reports_852')
        .select('id, created_at, conversation_id, messages, review_data, status')
        .neq('status', 'deleted')
        .or(`messages.ilike.%${term}%`)
        .order('created_at', { ascending: false })
        .limit(3)
    );

    const [issueResults, reportResults] = await Promise.all([
      Promise.all(issuePromises),
      Promise.all(reportPromises),
    ]);

    // Deduplicate issues by id
    const issueMap = new Map<string, IssueRecord>();
    for (const result of issueResults) {
      if (result.data) {
        for (const issue of result.data) {
          if (!issueMap.has(issue.id)) {
            issueMap.set(issue.id, issue as IssueRecord);
          }
        }
      }
    }

    // Sort by votes descending, take top N
    const issues = Array.from(issueMap.values())
      .sort((a, b) => b.votes - a.votes)
      .slice(0, limit);

    // Deduplicate and format reports
    const reportMap = new Map<string, CorrelatedReport>();
    for (const result of reportResults) {
      if (result.data) {
        for (const report of result.data) {
          if (!reportMap.has(report.id)) {
            const messages = Array.isArray(report.messages)
              ? report.messages
              : typeof report.messages === 'string'
                ? JSON.parse(report.messages)
                : [];
            const firstUserMsg = messages.find(
              (m: { role?: string; content?: string }) => m.role === 'user'
            );
            const themes =
              report.review_data && Array.isArray((report.review_data as Record<string, unknown>).temas)
                ? ((report.review_data as Record<string, unknown>).temas as string[])
                : [];

            reportMap.set(report.id, {
              id: report.id,
              created_at: report.created_at,
              conversation_id: report.conversation_id,
              snippet:
                typeof firstUserMsg?.content === 'string'
                  ? firstUserMsg.content.slice(0, 200)
                  : 'Relato compartilhado.',
              themes: themes.slice(0, 4),
            });
          }
        }
      }
    }

    const reports = Array.from(reportMap.values())
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);

    return { issues, reports };
  } catch (error) {
    console.error('[852-correlate] search error:', error);
    return { issues: [], reports: [] };
  }
}

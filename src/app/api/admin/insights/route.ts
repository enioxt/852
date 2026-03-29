/**
 * Cross-conversation insight aggregation
 * GET /api/admin/insights?days=30
 *
 * Aggregates recurring themes, tags and AI-review patterns across all
 * shared reports and conversations in the requested time window.
 * Returns ranked theme counts, tag frequency and top blind-spots —
 * all computed in-DB without a separate AI call (fast, cheap).
 */

import { getCurrentAdmin } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';

interface ThemeCount {
  theme: string;
  count: number;
  pct: number;
}

interface InsightSummary {
  totalReports: number;
  reportsWithReview: number;
  topThemes: ThemeCount[];
  topTags: ThemeCount[];
  topBlindSpots: ThemeCount[];
  statusBreakdown: Record<string, number>;
  windowDays: number;
  generatedAt: string;
}

function countTerms(items: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (key.length >= 2) counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function toRanked(counts: Record<string, number>, total: number, limit = 20): ThemeCount[] {
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([theme, count]) => ({
      theme,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}

export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return Response.json({ error: 'Supabase não configurado' }, { status: 503 });
  }

  const url = new URL(req.url);
  const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10)));
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: reports, error } = await sb
    .from('reports_852')
    .select('status, metadata, review_data')
    .neq('status', 'deleted')
    .gte('created_at', cutoff);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const list = reports || [];
  const totalReports = list.length;

  const allThemes: string[] = [];
  const allTags: string[] = [];
  const allBlindSpots: string[] = [];
  const statusBreakdown: Record<string, number> = {};
  let reportsWithReview = 0;

  for (const r of list) {
    // Status breakdown
    statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;

    // Tags from metadata
    const meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : (r.metadata || {});
    if (Array.isArray(meta.tags)) {
      allTags.push(...meta.tags.filter((t: unknown): t is string => typeof t === 'string'));
    }

    // Themes and blind spots from AI review
    const rd = typeof r.review_data === 'string' ? JSON.parse(r.review_data) : r.review_data;
    if (rd) {
      reportsWithReview++;
      if (Array.isArray(rd.temas)) {
        allThemes.push(...rd.temas.filter((t: unknown): t is string => typeof t === 'string'));
      }
      if (Array.isArray(rd.pontosCegos)) {
        allBlindSpots.push(...rd.pontosCegos.filter((t: unknown): t is string => typeof t === 'string'));
      }
    }
  }

  const summary: InsightSummary = {
    totalReports,
    reportsWithReview,
    topThemes: toRanked(countTerms(allThemes), reportsWithReview),
    topTags: toRanked(countTerms(allTags), totalReports),
    topBlindSpots: toRanked(countTerms(allBlindSpots), reportsWithReview, 10),
    statusBreakdown,
    windowDays: days,
    generatedAt: new Date().toISOString(),
  };

  return Response.json(summary);
}

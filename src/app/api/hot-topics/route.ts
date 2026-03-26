import { getSupabase, type IssueRecord } from '@/lib/supabase';

export const revalidate = 120;

export interface HotTopic extends IssueRecord {
  score: number;
  age_hours: number;
}

function computeScore(issue: IssueRecord): number {
  const votes = issue.votes || 0;
  const downvotes = (issue as any).downvotes || 0;
  const comments = issue.comment_count || 0;
  const qualityScore = (issue as any).quality_score || 0;
  const engagementPotential = (issue as any).engagement_potential || 0;
  
  const ageMs = Date.now() - new Date(issue.created_at).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  
  // If has engagement (votes or comments), use traditional scoring
  if (votes > 0 || comments > 0 || downvotes > 0) {
    const recencyBonus = Math.max(0, 100 - ageHours * 0.5);
    const voteScore = votes * 3 + downvotes * (-1) + comments * 2;
    return voteScore + recencyBonus;
  }
  
  // No engagement yet - use quality-based scoring
  // Quality score (0-100) + engagement potential (0-150) + recency decay
  const recencyDecay = Math.max(0, 50 - ageHours * 0.8); // Faster decay for new unvoted content
  const baseScore = qualityScore + engagementPotential * 0.5;
  
  return baseScore + recencyDecay;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

  const sb = getSupabase();
  if (!sb) {
    return Response.json({ topics: [], total: 0 });
  }

  try {
    const { data, error } = await sb
      .from('issues_852')
      .select('*')
      .in('status', ['open', 'in_discussion'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      return Response.json({ topics: [], total: 0 });
    }

    const scored: HotTopic[] = data
      .map((issue) => {
        const ageMs = Date.now() - new Date(issue.created_at).getTime();
        return {
          ...issue,
          score: computeScore(issue as IssueRecord),
          age_hours: Math.round(ageMs / (1000 * 60 * 60)),
        } as HotTopic;
      });

    scored.sort((a, b) => b.score - a.score);
    const topics = scored.slice(0, limit);

    // Aggregate categories for summary
    const categoryCounts: Record<string, number> = {};
    for (const t of topics) {
      const cat = t.category || 'outro';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    return Response.json({
      topics,
      total: data.length,
      categories: categoryCounts,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[852-hot-topics] error:', error);
    return Response.json({ topics: [], total: 0 }, { status: 500 });
  }
}

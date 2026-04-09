import { getPublicStats } from '@/lib/supabase';

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  const stats = await getPublicStats();

  // Edge caching headers (1 minute for stats)
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    'CDN-Cache-Control': 'public, max-age=60',
    'Vercel-CDN-Cache-Control': 'public, max-age=60',
  });

  if (!stats) {
    return new Response(
      JSON.stringify({
        totalConversations: 0,
        totalReportsShared: 0,
        totalReportsReviewedByAI: 0,
        totalIssuesOpen: 0,
        totalAIReports: 0,
        sharedReportsSinceLastAIReport: 0,
        latestAIReport: null,
        recentIssues: [],
        recentReports: [],
      }),
      { headers }
    );
  }

  return new Response(JSON.stringify(stats), { headers });
}

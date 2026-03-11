import { getPublicStats } from '@/lib/supabase';

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  const stats = await getPublicStats();
  if (!stats) {
    return Response.json({
      totalConversations: 0,
      totalReportsShared: 0,
      totalReportsReviewedByAI: 0,
      totalIssuesOpen: 0,
      totalAIReports: 0,
      sharedReportsSinceLastAIReport: 0,
      latestAIReport: null,
      recentIssues: [],
      recentReports: [],
    });
  }
  return Response.json(stats);
}

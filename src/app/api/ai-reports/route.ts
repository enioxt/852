import { getAIReportsWithIssues } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '12', 10);
  const category = searchParams.get('category') || undefined;
  const reports = await getAIReportsWithIssues(limit, category);
  return Response.json({ reports });
}

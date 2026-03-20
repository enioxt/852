import { getSupabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/user-auth';
import type { SuggestionHistoryItem } from '@/lib/suggestion-store';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = getSupabase();
  if (!sb) return Response.json({ error: 'DB Error' }, { status: 500 });

  const { data, error } = await sb
    .from('suggestion_drafts_852')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  
  const suggestions: SuggestionHistoryItem[] = data.map(d => ({
    id: d.id,
    title: d.title,
    rawBody: d.raw_body,
    sanitizedBody: d.sanitized_body,
    category: d.category,
    tags: d.tags || [],
    attachmentNames: d.attachment_names || [],
    piiRemoved: d.pii_removed,
    atrianScore: d.atrian_score,
    atrianPassed: d.atrian_passed,
    atrianViolationCount: d.atrian_violation_count,
    reviewData: d.review_data,
    issueId: d.issue_id,
    status: d.status,
    createdAt: new Date(d.created_at).getTime(),
    updatedAt: new Date(d.updated_at).getTime()
  }));

  return Response.json({ suggestions });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = getSupabase();
  if (!sb) return Response.json({ error: 'DB Error' }, { status: 500 });

  try {
    const body = await req.json();
    const action = body.action;

    if (action === 'delete') {
      const { id } = body;
      const { error } = await sb.from('suggestion_drafts_852').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return Response.json({ success: true });
    }

    if (action === 'sync') {
      const { item } = body as { item: SuggestionHistoryItem };
      const payload = {
        id: item.id,
        user_id: user.id,
        title: item.title || '',
        raw_body: item.rawBody || '',
        sanitized_body: item.sanitizedBody || '',
        category: item.category || 'Outro',
        tags: item.tags || [],
        attachment_names: item.attachmentNames || [],
        pii_removed: item.piiRemoved || 0,
        atrian_score: item.atrianScore || 0,
        atrian_passed: Boolean(item.atrianPassed),
        atrian_violation_count: item.atrianViolationCount || 0,
        review_data: item.reviewData || null,
        issue_id: item.issueId || null,
        status: item.status || 'draft',
        created_at: new Date(item.createdAt).toISOString(),
        updated_at: new Date(item.updatedAt).toISOString()
      };

      const { error } = await sb.from('suggestion_drafts_852').upsert(payload);
      if (error) throw error;
      return Response.json({ success: true });
    }
    
    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch(e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

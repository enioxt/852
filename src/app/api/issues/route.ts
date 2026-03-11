import { createIssue, getIssues, voteIssue, addIssueComment, getIssueComments } from '@/lib/supabase';
import { recordEvent } from '@/lib/telemetry';
import { getCurrentUser } from '@/lib/user-auth';
import { queueIssueNotification } from '@/lib/notifications';

function isValidatedOfficer(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  return Boolean(user?.masp && user.validation_status === 'approved');
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const aiReportId = searchParams.get('aiReportId') || undefined;
  const sortBy = (searchParams.get('sort') as 'votes' | 'created_at') || 'votes';
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const issues = await getIssues(status, limit, sortBy, aiReportId);
  return Response.json({ issues });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'vote') {
      const { issueId, sessionHash } = body;
      const user = await getCurrentUser();
      if (!isValidatedOfficer(user)) {
        return Response.json({ error: 'Apenas policiais com MASP validado podem votar.', needsValidatedOfficer: true }, { status: 403 });
      }
      if (!issueId || (!sessionHash && !user?.id)) {
        return Response.json({ error: 'issueId e identidade do votante obrigatórios' }, { status: 400 });
      }
      const result = await voteIssue(issueId, sessionHash || '', user?.id);
      if (result.voted) {
        recordEvent({ event_type: 'issue_voted', metadata: { issueId, userId: user?.id || null } });
        queueIssueNotification('issue_voted', {
          issueId,
          title: result.issue?.title,
          votes: result.issue?.votes,
        });
      }
      return Response.json(result);
    }

    if (action === 'comment') {
      const { issueId, commentBody } = body;
      const user = await getCurrentUser();
      if (!isValidatedOfficer(user)) {
        return Response.json({ error: 'Apenas policiais com MASP validado podem fazer follow-up.', needsValidatedOfficer: true }, { status: 403 });
      }
      if (!issueId || !commentBody) return Response.json({ error: 'issueId e body obrigatórios' }, { status: 400 });
      const id = await addIssueComment(issueId, commentBody);
      return Response.json({ commentId: id });
    }

    if (action === 'comments') {
      const { issueId } = body;
      if (!issueId) return Response.json({ error: 'issueId obrigatório' }, { status: 400 });
      const comments = await getIssueComments(issueId);
      return Response.json({ comments });
    }

    // Default: create issue
    const { title, body: issueBody, category } = body;
    if (!title) return Response.json({ error: 'Título obrigatório' }, { status: 400 });

    const id = await createIssue(title, issueBody, category, 'user');
    if (!id) return Response.json({ error: 'Falha ao criar' }, { status: 500 });

    recordEvent({ event_type: 'issue_created', metadata: { issueId: id, source: 'user' } });
    queueIssueNotification('issue_created', { issueId: id, title, category });
    return Response.json({ id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

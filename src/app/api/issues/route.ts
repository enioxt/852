import { createIssue, getIssues, voteIssue, addIssueComment, getIssueComments, getIssueVersions } from '@/lib/supabase';
import { recordEvent } from '@/lib/telemetry';
import { getCurrentUser } from '@/lib/user-auth';
import { queueIssueNotification } from '@/lib/notifications';

function isAuthenticatedParticipant(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  return Boolean(user?.id);
}

function hasValidatedMasp(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  return Boolean(user?.id && user.validation_status === 'approved');
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'versions') {
    const parentId = searchParams.get('parentId');
    if (!parentId) return Response.json({ error: 'parentId missing' }, { status: 400 });
    const versions = await getIssueVersions(parentId);
    return Response.json({ versions });
  }

  const status = searchParams.get('status') || undefined;
  const aiReportId = searchParams.get('aiReportId') || undefined;
  const category = searchParams.get('category') || undefined;
  const sortBy = (searchParams.get('sort') as 'votes' | 'created_at') || 'votes';
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const issues = await getIssues(status, limit, sortBy, aiReportId, false, category);
  return Response.json({ issues });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'vote') {
      const { issueId, sessionHash, voteType = 'up' } = body;
      const user = await getCurrentUser();
      if (!isAuthenticatedParticipant(user)) {
        return Response.json({ error: 'Entre com sua conta para votar.', needsAuth: true }, { status: 403 });
      }
      if (!hasValidatedMasp(user)) {
        return Response.json({ error: 'Seu MASP precisa estar validado para votar.', needsValidation: true }, { status: 403 });
      }
      if (!issueId || (!sessionHash && !user?.id)) {
        return Response.json({ error: 'issueId e identidade do votante obrigatórios' }, { status: 400 });
      }
      const result = await voteIssue(issueId, sessionHash || '', user?.id, voteType);
      
      if (result.voted && result.issue) {
        recordEvent({ event_type: 'issue_voted', metadata: { issueId, userId: user?.id || null, voteType } });
        queueIssueNotification('issue_voted', {
          issueId,
          title: result.issue?.title,
          category: result.issue?.category,
          votes: result.issue?.votes,
          downvotes: result.issue?.downvotes,
          voteType,
          votedByUserId: user?.id,
        });

        // Espiral de Escuta (AI Feedback Loop Trigger)
        const totalVotes = result.issue.votes + (result.issue.downvotes || 0);
        if (totalVotes >= 5) {
          const approvalRating = result.issue.votes / totalVotes;
          if (approvalRating < 0.85) {
            recordEvent({ event_type: 'espiral_de_escuta_triggered', metadata: { issueId, totalVotes, approvalRating } });
            // Dispatch background re-analysis without blocking the response
            const baseUrl = req.headers.get('origin') || req.headers.get('host') || '';
            const protocol = baseUrl.startsWith('http') ? '' : 'http://';
            fetch(`${protocol}${baseUrl}/api/issues/reanalyze`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ issueId }),
            }).catch((err) => console.error('[852] auto Espiral de Escuta re-analysis failed:', err.message));
          }
        }
      }
      return Response.json(result);
    }

    if (action === 'comment') {
      const { issueId, commentBody, parentCommentId } = body;
      const user = await getCurrentUser();
      if (!isAuthenticatedParticipant(user)) {
        return Response.json({ error: 'Entre com sua conta para comentar.', needsAuth: true }, { status: 403 });
      }
      if (!hasValidatedMasp(user)) {
        return Response.json({ error: 'Seu MASP precisa estar validado para comentar.', needsValidation: true }, { status: 403 });
      }
      if (!issueId || !commentBody) return Response.json({ error: 'issueId e body obrigatórios' }, { status: 400 });
      const id = await addIssueComment(issueId, commentBody, false, user?.id, parentCommentId);
      return Response.json({ commentId: id });
    }

    if (action === 'comments') {
      const { issueId } = body;
      if (!issueId) return Response.json({ error: 'issueId obrigatório' }, { status: 400 });
      const comments = await getIssueComments(issueId);
      // Build threaded structure
      const commentMap = new Map();
      const rootComments = [];
      
      // First pass: create map
      for (const c of comments) {
        commentMap.set(c.id, { ...c, replies: [] });
      }
      
      // Second pass: build tree
      for (const c of comments) {
        const comment = commentMap.get(c.id);
        if ((c as any).parent_comment_id && commentMap.has((c as any).parent_comment_id)) {
          const parent = commentMap.get((c as any).parent_comment_id);
          parent.replies.push(comment);
        } else {
          rootComments.push(comment);
        }
      }
      
      return Response.json({ comments: rootComments, flat: comments });
    }

    // Default: create issue
    const { title, body: issueBody, category, parentId, versionReason } = body;
    if (!title) return Response.json({ error: 'Título obrigatório' }, { status: 400 });

    let versionAuthorId: string | undefined = undefined;
    let authorId: string | undefined = undefined;

    const user = await getCurrentUser();
    if (user?.id) {
      authorId = user.id;
    }

    if (parentId) {
      if (!isAuthenticatedParticipant(user)) {
        return Response.json({ error: 'Você precisa estar logado para divergir ou evoluir um insight.', needsAuth: true }, { status: 403 });
      }
      if (!hasValidatedMasp(user)) {
        return Response.json({ error: 'Seu MASP precisa estar validado para divergir.', needsValidation: true }, { status: 403 });
      }
      versionAuthorId = user?.id;
      if (!versionReason) {
        return Response.json({ error: 'O motivo da divergência é obrigatório.' }, { status: 400 });
      }
    }

    const id = await createIssue(title, issueBody, category, 'user', undefined, parentId, versionAuthorId, versionReason, authorId);
    if (!id) return Response.json({ error: 'Falha ao criar' }, { status: 500 });

    recordEvent({ event_type: 'issue_created', metadata: { issueId: id, source: 'user', isBranch: !!parentId } });
    if (!parentId) {
      queueIssueNotification('issue_created', { issueId: id, title, category });
    }
    return Response.json({ id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

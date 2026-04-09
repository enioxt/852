/**
 * Issue Follow API — 852 Inteligência
 *
 * Enable/disable follow-up mode for forum issues.
 */

import { getCurrentUser } from '@/lib/user-auth';
import {
  enableFollowUp,
  disableFollowUp,
  isFollowingIssue,
} from '@/lib/forum-notifications';

/**
 * POST /api/issues/follow
 * Enable or disable follow-up for an issue
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { issueId, action, settings } = body;

    if (!issueId || !action) {
      return Response.json({ error: 'issueId e action são obrigatórios' }, { status: 400 });
    }

    if (action === 'follow') {
      const success = await enableFollowUp(user.id, issueId, {
        notifyOnComment: settings?.notifyOnComment ?? true,
        notifyOnResolution: settings?.notifyOnResolution ?? true,
        notifyOnVote: settings?.notifyOnVote ?? false,
      });

      if (!success) {
        return Response.json({ error: 'Erro ao seguir tópico' }, { status: 500 });
      }

      return Response.json({
        success: true,
        following: true,
        message: 'Você está seguindo este tópico. Receberá notificações sobre novas atividades.',
      });
    }

    if (action === 'unfollow') {
      const success = await disableFollowUp(user.id, issueId);

      if (!success) {
        return Response.json({ error: 'Erro ao deixar de seguir' }, { status: 500 });
      }

      return Response.json({
        success: true,
        following: false,
        message: 'Você deixou de seguir este tópico.',
      });
    }

    return Response.json({ error: 'Ação inválida (use follow ou unfollow)' }, { status: 400 });
  } catch (error) {
    console.error('[api/issues/follow] error:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * GET /api/issues/follow?issueId=xxx
 * Check if user is following an issue
 */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const issueId = searchParams.get('issueId');

    if (!issueId) {
      return Response.json({ error: 'issueId é obrigatório' }, { status: 400 });
    }

    const isFollowing = await isFollowingIssue(user.id, issueId);

    return Response.json({
      following: isFollowing,
      issueId,
    });
  } catch (error) {
    console.error('[api/issues/follow] GET error:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}

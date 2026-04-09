/**
 * User Notification Preferences API — 852 Inteligência
 *
 * GET: Retrieve user's notification preferences
 * POST: Update notification preferences
 */

import { getCurrentUser } from '@/lib/user-auth';
import {
  getOrCreatePreferences,
  updatePreferences,
  subscribeToIssue,
  unsubscribeFromIssue,
  isSubscribed,
  getPendingNotifications,
} from '@/lib/email-notifications';

/**
 * GET /api/user/notifications
 * Get user's notification preferences and pending notifications
 */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includePending = searchParams.get('pending') === 'true';
    const issueId = searchParams.get('issueId');

    // Get preferences
    const preferences = await getOrCreatePreferences(user.id);
    if (!preferences) {
      return Response.json(
        { error: 'Erro ao carregar preferências' },
        { status: 500 }
      );
    }

    const result: Record<string, unknown> = { preferences };

    // Check subscription status for specific issue
    if (issueId) {
      const subscription = await isSubscribed(user.id, issueId);
      result.subscription = subscription;
    }

    // Include pending notifications
    if (includePending) {
      const pending = await getPendingNotifications(user.id);
      result.pendingNotifications = pending;
    }

    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error('[api/user/notifications] error:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/user/notifications
 * Update notification preferences or manage subscriptions
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      action,
      preferences,
      issueId,
      subscriptionType,
      emailEnabled,
    } = body;

    // Update general preferences
    if (action === 'update_preferences' && preferences) {
      const success = await updatePreferences(user.id, preferences);

      if (!success) {
        return Response.json(
          { error: 'Falha ao atualizar preferências' },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        message: 'Preferências atualizadas',
      });
    }

    // Subscribe to issue notifications
    if (action === 'subscribe' && issueId) {
      const success = await subscribeToIssue(
        user.id,
        issueId,
        subscriptionType || 'manual',
        emailEnabled ?? true
      );

      if (!success) {
        return Response.json(
          { error: 'Falha ao ativar notificações' },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        message: 'Notificações ativadas para este tópico',
      });
    }

    // Unsubscribe from issue notifications
    if (action === 'unsubscribe' && issueId) {
      const success = await unsubscribeFromIssue(user.id, issueId);

      if (!success) {
        return Response.json(
          { error: 'Falha ao desativar notificações' },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        message: 'Notificações desativadas para este tópico',
      });
    }

    return Response.json(
      { error: 'Ação inválida ou parâmetros insuficientes' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[api/user/notifications] error:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

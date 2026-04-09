/**
 * Notifications API — 852 Inteligência
 *
 * User notification management for forum activities.
 */

import { getCurrentUser } from '@/lib/user-auth';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
} from '@/lib/forum-notifications';

/**
 * GET /api/notifications
 * Get user's notifications
 */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get unread count for badge
    const unreadCount = await getUnreadNotificationCount(user.id);

    // Get notifications list
    const notifications = await getUserNotifications(user.id, limit);

    const filtered = unreadOnly
      ? notifications.filter(n => !n.read)
      : notifications;

    return Response.json({
      notifications: filtered,
      unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    console.error('[api/notifications] GET error:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/notifications
 * Mark notification(s) as read
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { action, notificationId } = body;

    if (action === 'mark_all_read') {
      const success = await markAllNotificationsRead(user.id);
      if (!success) {
        return Response.json({ error: 'Erro ao marcar notificações' }, { status: 500 });
      }

      return Response.json({
        success: true,
        message: 'Todas as notificações marcadas como lidas',
      });
    }

    if (action === 'mark_read' && notificationId) {
      const success = await markNotificationRead(user.id, notificationId);
      if (!success) {
        return Response.json({ error: 'Erro ao marcar notificação' }, { status: 500 });
      }

      return Response.json({
        success: true,
        message: 'Notificação marcada como lida',
      });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('[api/notifications] POST error:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}

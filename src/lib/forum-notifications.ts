/**
 * Forum Notifications — 852 Inteligência
 *
 * Handles user notifications for forum activities:
 * - New comments on followed topics
 * - Mentions (@username)
 * - Follow-up mode (watching threads)
 * - Integration with Telegram/Discord webhooks
 */

import { getSupabase } from './supabase';
import { recordEvent } from './telemetry';

export interface ForumNotification {
  id: string;
  userId: string;
  type: 'new_comment' | 'mention' | 'vote_on_your_issue' | 'issue_resolved' | 'follow_up';
  issueId: string;
  issueTitle: string;
  actorId?: string; // Who triggered the notification
  actorName?: string;
  read: boolean;
  createdAt: string;
  deepLink: string;
}

export interface FollowUpSettings {
  userId: string;
  issueId: string;
  notifyOnComment: boolean;
  notifyOnResolution: boolean;
  notifyOnVote: boolean;
  createdAt: string;
}

/**
 * Create a notification for a forum event
 */
export async function createForumNotification(
  userId: string,
  type: ForumNotification['type'],
  issueId: string,
  issueTitle: string,
  actorId?: string,
  actorName?: string
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const deepLink = `/papo-de-corredor?issue=${issueId}&notification=true`;

  const { error } = await sb.from('forum_notifications_852').insert({
    user_id: userId,
    type,
    issue_id: issueId,
    issue_title: issueTitle,
    actor_id: actorId,
    actor_name: actorName,
    read: false,
    deep_link: deepLink,
  });

  if (error) {
    console.error('[forum-notifications] create error:', error);
    return false;
  }

  recordEvent({
    event_type: 'forum_notification_created',
    metadata: { userId, type, issueId },
  });

  return true;
}

/**
 * Get user's unread notifications
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 20
): Promise<ForumNotification[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('forum_notifications_852')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[forum-notifications] get error:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    issueId: row.issue_id,
    issueTitle: row.issue_title,
    actorId: row.actor_id,
    actorName: row.actor_name,
    read: row.read,
    createdAt: row.created_at,
    deepLink: row.deep_link,
  }));
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('forum_notifications_852')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    console.error('[forum-notifications] mark read error:', error);
    return false;
  }

  return true;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('forum_notifications_852')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('[forum-notifications] mark all read error:', error);
    return false;
  }

  return true;
}

/**
 * Enable follow-up mode for an issue
 */
export async function enableFollowUp(
  userId: string,
  issueId: string,
  settings: Omit<FollowUpSettings, 'userId' | 'issueId' | 'createdAt'>
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb.from('forum_follow_ups_852').upsert({
    user_id: userId,
    issue_id: issueId,
    notify_on_comment: settings.notifyOnComment,
    notify_on_resolution: settings.notifyOnResolution,
    notify_on_vote: settings.notifyOnVote,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,issue_id' });

  if (error) {
    console.error('[forum-notifications] follow-up error:', error);
    return false;
  }

  recordEvent({
    event_type: 'forum_follow_up_enabled',
    metadata: { userId, issueId },
  });

  return true;
}

/**
 * Disable follow-up mode
 */
export async function disableFollowUp(userId: string, issueId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('forum_follow_ups_852')
    .delete()
    .eq('user_id', userId)
    .eq('issue_id', issueId);

  if (error) {
    console.error('[forum-notifications] unfollow error:', error);
    return false;
  }

  recordEvent({
    event_type: 'forum_follow_up_disabled',
    metadata: { userId, issueId },
  });

  return true;
}

/**
 * Check if user is following an issue
 */
export async function isFollowingIssue(userId: string, issueId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { data } = await sb
    .from('forum_follow_ups_852')
    .select('id')
    .eq('user_id', userId)
    .eq('issue_id', issueId)
    .maybeSingle();

  return !!data;
}

/**
 * Get all users following an issue (for batch notifications)
 */
export async function getIssueFollowers(issueId: string): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data } = await sb
    .from('forum_follow_ups_852')
    .select('user_id')
    .eq('issue_id', issueId)
    .eq('notify_on_comment', true);

  return (data || []).map(row => row.user_id);
}

/**
 * Process mentions in text and create notifications
 */
export async function processMentions(
  text: string,
  issueId: string,
  issueTitle: string,
  actorId: string,
  actorName: string
): Promise<number> {
  const mentionPattern = /@(\w+)/g;
  const mentions = [...text.matchAll(mentionPattern)].map(m => m[1]);

  if (mentions.length === 0) return 0;

  const sb = getSupabase();
  if (!sb) return 0;

  // Find users by display name or username
  const { data: users } = await sb
    .from('users_852')
    .select('id, display_name, nickname')
    .or(`display_name.in.(${mentions.join(',')}),nickname.in.(${mentions.join(',')})`);

  let count = 0;
  for (const user of users || []) {
    const success = await createForumNotification(
      user.id,
      'mention',
      issueId,
      issueTitle,
      actorId,
      actorName
    );
    if (success) count++;
  }

  return count;
}

/**
 * Notify followers of an issue about new activity
 */
export async function notifyFollowers(
  issueId: string,
  issueTitle: string,
  type: 'new_comment' | 'vote_on_your_issue' | 'issue_resolved',
  actorId: string,
  actorName: string,
  excludeUserId?: string // Don't notify the actor
): Promise<number> {
  const followers = await getIssueFollowers(issueId);
  const targets = excludeUserId
    ? followers.filter(id => id !== excludeUserId)
    : followers;

  let count = 0;
  for (const userId of targets) {
    const success = await createForumNotification(
      userId,
      type,
      issueId,
      issueTitle,
      actorId,
      actorName
    );
    if (success) count++;
  }

  return count;
}

/**
 * Get notification count for user (for badge)
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;

  const { count, error } = await sb
    .from('forum_notifications_852')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('[forum-notifications] count error:', error);
    return 0;
  }

  return count || 0;
}

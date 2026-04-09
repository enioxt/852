/**
 * Email Notifications — 852 Inteligência
 *
 * Email notification system for forum activity:
 * - Daily digest of followed topics
 * - Immediate notifications for mentions/replies
 * - Quiet hours support
 * - Bounce/delivery tracking
 */

import { getSupabase } from './supabase';
import { recordEvent } from './telemetry';

// Types
export interface NotificationPreferences {
  id: string;
  userId: string;
  dailyDigestEnabled: boolean;
  digestHour: number;
  digestDayOfWeek: number | null;
  immediateOnMention: boolean;
  immediateOnReply: boolean;
  notifyNewIssues: boolean;
  notifyComments: boolean;
  notifyVotes: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  createdAt: string;
  updatedAt: string;
}

export interface IssueSubscription {
  id: string;
  userId: string;
  issueId: string;
  subscriptionType: 'vote' | 'comment' | 'manual' | 'author';
  emailEnabled: boolean;
  inAppEnabled: boolean;
  createdAt: string;
}

export interface PendingNotification {
  id: string;
  userId: string;
  notificationType: 'digest' | 'immediate_comment' | 'immediate_mention' | 'vote_milestone';
  issueId: string | null;
  commentId: string | null;
  title: string | null;
  preview: string | null;
  actorNickname: string | null;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  scheduledFor: string;
  createdAt: string;
}

export interface DigestData {
  userId: string;
  email: string;
  nickname: string;
  preferences: {
    daily_digest_enabled: boolean;
    digest_hour: number;
    notify_new_issues: boolean;
    notify_comments: boolean;
  };
}

// Get or create default notification preferences for a user
export async function getOrCreatePreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  const sb = getSupabase();
  if (!sb) return null;

  // Try to get existing
  const { data: existing } = await sb
    .from('notification_preferences_852')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    return {
      id: existing.id,
      userId: existing.user_id,
      dailyDigestEnabled: existing.daily_digest_enabled,
      digestHour: existing.digest_hour,
      digestDayOfWeek: existing.digest_day_of_week,
      immediateOnMention: existing.immediate_on_mention,
      immediateOnReply: existing.immediate_on_reply,
      notifyNewIssues: existing.notify_new_issues,
      notifyComments: existing.notify_comments,
      notifyVotes: existing.notify_votes,
      quietHoursStart: existing.quiet_hours_start,
      quietHoursEnd: existing.quiet_hours_end,
      createdAt: existing.created_at,
      updatedAt: existing.updated_at,
    };
  }

  // Create defaults
  const { data: created, error } = await sb
    .from('notification_preferences_852')
    .insert({ user_id: userId })
    .select()
    .single();

  if (error || !created) {
    console.error('[email-notifications] Failed to create preferences:', error);
    return null;
  }

  return {
    id: created.id,
    userId: created.user_id,
    dailyDigestEnabled: created.daily_digest_enabled,
    digestHour: created.digest_hour,
    digestDayOfWeek: created.digest_day_of_week,
    immediateOnMention: created.immediate_on_mention,
    immediateOnReply: created.immediate_on_reply,
    notifyNewIssues: created.notify_new_issues,
    notifyComments: created.notify_comments,
    notifyVotes: created.notify_votes,
    quietHoursStart: created.quiet_hours_start,
    quietHoursEnd: created.quiet_hours_end,
    createdAt: created.created_at,
    updatedAt: created.updated_at,
  };
}

// Update notification preferences
export async function updatePreferences(
  userId: string,
  updates: Partial<Omit<NotificationPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.dailyDigestEnabled !== undefined) {
    dbUpdates.daily_digest_enabled = updates.dailyDigestEnabled;
  }
  if (updates.digestHour !== undefined) {
    dbUpdates.digest_hour = updates.digestHour;
  }
  if (updates.digestDayOfWeek !== undefined) {
    dbUpdates.digest_day_of_week = updates.digestDayOfWeek;
  }
  if (updates.immediateOnMention !== undefined) {
    dbUpdates.immediate_on_mention = updates.immediateOnMention;
  }
  if (updates.immediateOnReply !== undefined) {
    dbUpdates.immediate_on_reply = updates.immediateOnReply;
  }
  if (updates.notifyNewIssues !== undefined) {
    dbUpdates.notify_new_issues = updates.notifyNewIssues;
  }
  if (updates.notifyComments !== undefined) {
    dbUpdates.notify_comments = updates.notifyComments;
  }
  if (updates.notifyVotes !== undefined) {
    dbUpdates.notify_votes = updates.notifyVotes;
  }
  if (updates.quietHoursStart !== undefined) {
    dbUpdates.quiet_hours_start = updates.quietHoursStart;
  }
  if (updates.quietHoursEnd !== undefined) {
    dbUpdates.quiet_hours_end = updates.quietHoursEnd;
  }

  const { error } = await sb
    .from('notification_preferences_852')
    .update(dbUpdates)
    .eq('user_id', userId);

  if (error) {
    console.error('[email-notifications] Failed to update preferences:', error);
    return false;
  }

  recordEvent({
    event_type: 'notification_preferences_updated',
    metadata: { userId, updates: Object.keys(updates) },
  });

  return true;
}

// Subscribe to issue notifications
export async function subscribeToIssue(
  userId: string,
  issueId: string,
  subscriptionType: 'vote' | 'comment' | 'manual' | 'author',
  emailEnabled = true
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('issue_notification_subscriptions_852')
    .upsert({
      user_id: userId,
      issue_id: issueId,
      subscription_type: subscriptionType,
      email_enabled: emailEnabled,
    }, {
      onConflict: 'user_id, issue_id',
    });

  if (error) {
    console.error('[email-notifications] Failed to subscribe:', error);
    return false;
  }

  recordEvent({
    event_type: 'issue_notification_subscribed',
    metadata: { userId, issueId, subscriptionType, emailEnabled },
  });

  return true;
}

// Unsubscribe from issue notifications
export async function unsubscribeFromIssue(
  userId: string,
  issueId: string
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('issue_notification_subscriptions_852')
    .delete()
    .eq('user_id', userId)
    .eq('issue_id', issueId);

  if (error) {
    console.error('[email-notifications] Failed to unsubscribe:', error);
    return false;
  }

  recordEvent({
    event_type: 'issue_notification_unsubscribed',
    metadata: { userId, issueId },
  });

  return true;
}

// Check if user is subscribed to an issue
export async function isSubscribed(
  userId: string,
  issueId: string
): Promise<{ subscribed: boolean; emailEnabled: boolean }> {
  const sb = getSupabase();
  if (!sb) return { subscribed: false, emailEnabled: false };

  const { data } = await sb
    .from('issue_notification_subscriptions_852')
    .select('email_enabled')
    .eq('user_id', userId)
    .eq('issue_id', issueId)
    .single();

  return {
    subscribed: !!data,
    emailEnabled: data?.email_enabled ?? false,
  };
}

// Queue immediate notification (for mentions/replies)
export async function queueImmediateNotification(
  userId: string,
  issueId: string,
  notificationType: 'immediate_comment' | 'immediate_mention',
  title: string,
  preview: string,
  actorNickname: string
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  // Check user preferences
  const prefs = await getOrCreatePreferences(userId);
  if (!prefs) return null;

  // Check if should notify based on type
  if (notificationType === 'immediate_mention' && !prefs.immediateOnMention) {
    return null;
  }
  if (notificationType === 'immediate_comment' && !prefs.immediateOnReply) {
    return null;
  }

  // Use RPC to queue with quiet hours logic
  const { data, error } = await sb.rpc('queue_immediate_notification', {
    p_user_id: userId,
    p_issue_id: issueId,
    p_notification_type: notificationType,
    p_title: title,
    p_preview: preview,
    p_actor_nickname: actorNickname,
  });

  if (error) {
    console.error('[email-notifications] Failed to queue notification:', error);
    return null;
  }

  return data;
}

// Get pending notifications for digest
export async function getPendingNotifications(
  userId: string,
  limit = 50
): Promise<PendingNotification[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data } = await sb
    .from('notification_queue_852')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).map((n) => ({
    id: n.id,
    userId: n.user_id,
    notificationType: n.notification_type,
    issueId: n.issue_id,
    commentId: n.comment_id,
    title: n.title,
    preview: n.preview,
    actorNickname: n.actor_nickname,
    status: n.status,
    scheduledFor: n.scheduled_for,
    createdAt: n.created_at,
  }));
}

// Mark notification as sent
export async function markNotificationSent(
  notificationId: string,
  resendMessageId?: string
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('notification_queue_852')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    console.error('[email-notifications] Failed to mark sent:', error);
    return false;
  }

  // Also log to sent_emails
  if (resendMessageId) {
    // This would be called after actual send
  }

  return true;
}

// Get digest subscribers for a given hour (admin/cron use)
export async function getDigestSubscribers(hour: number): Promise<DigestData[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb.rpc('get_digest_subscribers', {
    target_hour: hour,
  });

  if (error) {
    console.error('[email-notifications] Failed to get subscribers:', error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    userId: row.user_id as string,
    email: row.email as string,
    nickname: row.nickname as string,
    preferences: row.preferences as DigestData['preferences'],
  }));
}

// Get recent activity for a user (for digest content)
export async function getRecentActivityForDigest(
  userId: string,
  since: Date
): Promise<{
  newComments: Array<{
    issueId: string;
    issueTitle: string;
    commentCount: number;
    lastCommentAt: string;
  }>;
  newVotes: Array<{
    issueId: string;
    issueTitle: string;
    voteDelta: number;
  }>;
  newIssues: Array<{
    id: string;
    title: string;
    category: string;
    votes: number;
  }>;
}> {
  const sb = getSupabase();
  if (!sb) {
    return { newComments: [], newVotes: [], newIssues: [] };
  }

  // Get subscribed issues
  const { data: subscriptions } = await sb
    .from('issue_notification_subscriptions_852')
    .select('issue_id')
    .eq('user_id', userId)
    .eq('email_enabled', true);

  const issueIds = (subscriptions || []).map((s) => s.issue_id);

  if (issueIds.length === 0) {
    return { newComments: [], newVotes: [], newIssues: [] };
  }

  // Get new comments on subscribed issues
  const { data: comments } = await sb
    .from('issue_comments_852')
    .select(`
      issue_id,
      issues_852!inner(title),
      created_at
    `)
    .in('issue_id', issueIds)
    .gt('created_at', since.toISOString())
    .neq('user_id', userId); // Exclude own comments

  // Aggregate comments by issue
  const commentMap = new Map();
  (comments || []).forEach((c: Record<string, unknown>) => {
    const id = c.issue_id as string;
    const issueData = c.issues_852 as { title: string } | null;
    if (!commentMap.has(id)) {
      commentMap.set(id, {
        issueId: id,
        issueTitle: issueData?.title || 'Tópico sem título',
        commentCount: 0,
        lastCommentAt: c.created_at as string,
      });
    }
    const existing = commentMap.get(id);
    existing.commentCount++;
    const commentDate = c.created_at as string;
    if (commentDate > existing.lastCommentAt) {
      existing.lastCommentAt = commentDate;
    }
  });

  // Get new votes on subscribed issues
  const { data: votes } = await sb
    .from('issue_votes_852')
    .select(`
      issue_id,
      vote_type,
      created_at
    `)
    .in('issue_id', issueIds)
    .gt('created_at', since.toISOString());

  // Aggregate votes
  const voteMap = new Map();
  (votes || []).forEach((v) => {
    const id = v.issue_id;
    if (!voteMap.has(id)) {
      voteMap.set(id, { issueId: id, voteDelta: 0 });
    }
    const delta = v.vote_type === 'up' ? 1 : -1;
    voteMap.get(id).voteDelta += delta;
  });

  // Get new issues (if user opted in)
  const { data: newIssues } = await sb
    .from('issues_852')
    .select('id, title, category, upvotes')
    .gt('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    newComments: Array.from(commentMap.values()),
    newVotes: Array.from(voteMap.values()),
    newIssues: (newIssues || []).map((i) => ({
      id: i.id,
      title: i.title,
      category: i.category,
      votes: i.upvotes,
    })),
  };
}

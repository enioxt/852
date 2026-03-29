/**
 * Email notification channel for issue events
 * Handles sending emails to users based on their notification preferences
 */

import { sendEmail } from '@/lib/mailer';
import { getSupabase } from '@/lib/supabase';
import {
  generateIssueVoteEmailHtml,
  generateIssueVoteEmailText,
  type IssueVoteEmailContext,
} from '@/lib/email-templates/issue-vote-notification';
import {
  generateIssueCommentEmailHtml,
  generateIssueCommentEmailText,
  type IssueCommentEmailContext,
} from '@/lib/email-templates/issue-comment-notification';
import { recordEvent } from '@/lib/telemetry';

interface IssueCommentNotificationPayload {
  issueId: string;
  title?: string | null;
  category?: string | null;
  commentedByUserId?: string;
}

interface IssueVoteNotificationPayload {
  issueId: string;
  title?: string | null;
  category?: string | null;
  votes?: number;
  downvotes?: number;
  voteType: 'up' | 'down';
  votedByUserId?: string;
}

/**
 * Send email notifications to all users who participated in an issue when it receives a vote
 * Respects user notification preferences
 */
export async function sendIssueVoteEmails(payload: IssueVoteNotificationPayload): Promise<void> {
  const baseUrl = (process.env.PUBLIC_BASE_URL || 'https://852.egos.ia.br').replace(/\/$/, '');

  try {
    const supabase = getSupabase();
    if (!supabase) {
      console.error('[Email Notifications] Supabase client unavailable');
      return;
    }

    // 1. Find all users who participated in this issue (voters + commenters)
    const { data: participantIds, error: fetchError } = await supabase.rpc('get_issue_participants', {
      p_issue_id: payload.issueId,
    });

    if (fetchError) {
      console.error('[Email Notifications] Failed to fetch participants:', fetchError);
      await recordEvent({
        event_type: 'notification_error',
        error_message: `Failed to fetch participants: ${fetchError.message}`,
        metadata: {
          kind: 'issue_voted',
          issueId: payload.issueId,
        },
      });
      return;
    }

    if (!participantIds || participantIds.length === 0) {
      // No participants to notify
      return;
    }

    // 2. Fetch notification preferences and emails for these users
    const { data: userPreferences, error: prefError } = await supabase
      .from('user_accounts_852')
      .select('id, email, display_name')
      .in('id', participantIds)
      .neq('id', payload.votedByUserId || '00000000-0000-0000-0000-000000000000'); // Don't notify the voter themselves

    if (prefError) {
      console.error('[Email Notifications] Failed to fetch user preferences:', prefError);
      return;
    }

    if (!userPreferences || userPreferences.length === 0) {
      return;
    }

    // 3. Fetch notification preferences for each user
    const { data: preferences, error: prefsError } = await supabase
      .from('user_notification_preferences_852')
      .select('user_id, notify_on_issue_votes, digest_frequency')
      .in('user_id', userPreferences.map((u) => u.id));

    if (prefsError) {
      console.error('[Email Notifications] Failed to fetch preferences:', prefsError);
      return;
    }

    // Build a map of user ID -> preferences
    const prefsMap = new Map(
      (preferences || []).map((p) => [
        p.user_id,
        {
          notifyOnVotes: p.notify_on_issue_votes,
          frequency: p.digest_frequency,
        },
      ])
    );

    // 4. Send emails to users who have opted in and are using immediate frequency
    let sentCount = 0;
    let errorCount = 0;

    for (const user of userPreferences) {
      const prefs = prefsMap.get(user.id);

      // Skip if user hasn't set preferences (defaults to notify=true)
      const shouldNotify = prefs?.notifyOnVotes !== false;
      const isImmediate = !prefs || prefs.frequency === 'immediate';

      if (!shouldNotify || !isImmediate) {
        continue;
      }

      try {
        const emailContext: IssueVoteEmailContext = {
          recipientName: user.display_name || 'colega',
          recipientEmail: user.email,
          issueTitle: payload.title || 'Sem título',
          issueId: payload.issueId,
          issueCategory: payload.category,
          currentVotes: payload.votes || 0,
          voteType: payload.voteType,
          appBaseUrl: baseUrl,
        };

        const htmlContent = generateIssueVoteEmailHtml(emailContext);
        const textContent = generateIssueVoteEmailText(emailContext);

        await sendEmail({
          to: user.email,
          subject: `Nova atividade: "${(payload.title || 'Tópico').slice(0, 50)}..." no Papo de Corredor`,
          html: htmlContent,
          text: textContent,
        });

        sentCount++;
      } catch (error) {
        console.error(`[Email Notifications] Failed to send email to ${user.email}:`, error);
        errorCount++;
      }
    }

    // 5. Record event
    if (sentCount > 0 || errorCount > 0) {
      await recordEvent({
        event_type: 'issue_vote_emails_sent',
        metadata: {
          issueId: payload.issueId,
          sentCount,
          errorCount,
          voteType: payload.voteType,
        },
      });
    }

    console.log(`[Email Notifications] Issue ${payload.issueId}: sent ${sentCount} emails, ${errorCount} errors`);
  } catch (error) {
    console.error('[Email Notifications] Unexpected error:', error);
    await recordEvent({
      event_type: 'notification_error',
      error_message: `Email notification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metadata: {
        kind: 'issue_voted',
        issueId: payload.issueId,
      },
    });
  }
}

/**
 * Send email notifications to all users who participated in an issue when it receives a new comment
 * Respects user notification preferences (notify_on_issue_comments)
 */
export async function sendIssueCommentEmails(payload: IssueCommentNotificationPayload): Promise<void> {
  const baseUrl = (process.env.PUBLIC_BASE_URL || 'https://852.egos.ia.br').replace(/\/$/, '');

  try {
    const supabase = getSupabase();
    if (!supabase) {
      console.error('[Email Notifications] Supabase client unavailable');
      return;
    }

    const { data: participantIds, error: fetchError } = await supabase.rpc('get_issue_participants', {
      p_issue_id: payload.issueId,
    });

    if (fetchError || !participantIds || participantIds.length === 0) {
      if (fetchError) console.error('[Email Notifications] Failed to fetch participants for comment:', fetchError);
      return;
    }

    const { data: userPreferences, error: prefError } = await supabase
      .from('user_accounts_852')
      .select('id, email, display_name')
      .in('id', participantIds)
      .neq('id', payload.commentedByUserId || '00000000-0000-0000-0000-000000000000');

    if (prefError || !userPreferences || userPreferences.length === 0) return;

    const { data: preferences } = await supabase
      .from('user_notification_preferences_852')
      .select('user_id, notify_on_issue_comments, digest_frequency')
      .in('user_id', userPreferences.map((u) => u.id));

    const prefsMap = new Map(
      (preferences || []).map((p) => [p.user_id, { notifyOnComments: p.notify_on_issue_comments, frequency: p.digest_frequency }])
    );

    let sentCount = 0;
    let errorCount = 0;

    for (const user of userPreferences) {
      const prefs = prefsMap.get(user.id);
      const shouldNotify = prefs?.notifyOnComments !== false;
      const isImmediate = !prefs || prefs.frequency === 'immediate';
      if (!shouldNotify || !isImmediate) continue;

      try {
        const emailContext: IssueCommentEmailContext = {
          recipientName: user.display_name || 'colega',
          recipientEmail: user.email,
          issueTitle: payload.title || 'Sem título',
          issueId: payload.issueId,
          issueCategory: payload.category,
          appBaseUrl: baseUrl,
        };
        const htmlContent = generateIssueCommentEmailHtml(emailContext);
        const textContent = generateIssueCommentEmailText(emailContext);
        await sendEmail({
          to: user.email,
          subject: `Novo comentário: "${(payload.title || 'Tópico').slice(0, 50)}..." no Papo de Corredor`,
          html: htmlContent,
          text: textContent,
        });
        sentCount++;
      } catch (error) {
        console.error(`[Email Notifications] Failed to send comment email to ${user.email}:`, error);
        errorCount++;
      }
    }

    if (sentCount > 0 || errorCount > 0) {
      await recordEvent({
        event_type: 'issue_comment_emails_sent',
        metadata: { issueId: payload.issueId, sentCount, errorCount },
      });
    }
  } catch (error) {
    console.error('[Email Notifications] Unexpected error in comment notifications:', error);
  }
}

/**
 * Create a database function to get issue participants if not already exists
 * This should be created via migration or called once during setup
 */
export async function ensureGetIssueParticipantsFunction(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const functionSQL = `
    CREATE OR REPLACE FUNCTION get_issue_participants(p_issue_id UUID)
    RETURNS TABLE(user_id UUID) AS $$
    BEGIN
      RETURN QUERY
      SELECT DISTINCT user_id FROM (
        SELECT user_id FROM issue_votes_852 WHERE issue_id = p_issue_id AND user_id IS NOT NULL
        UNION
        SELECT user_id FROM issue_comments_852 WHERE issue_id = p_issue_id AND user_id IS NOT NULL
      ) AS participants
      WHERE user_id IS NOT NULL;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  try {
    await supabase.rpc('query', { query: functionSQL });
  } catch (error) {
    // Function likely already exists, ignore
    console.log('[Email Notifications] Function get_issue_participants already exists or setup');
  }
}

export type { IssueVoteNotificationPayload, IssueCommentNotificationPayload };

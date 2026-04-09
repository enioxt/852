-- Migration: Notification Preferences + Email Digest System
-- Created: 2026-04-09
-- Purpose: Enable email notifications for forum activity

-- 1. User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences_852 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_accounts_852(id) ON DELETE CASCADE,

  -- Digest settings
  daily_digest_enabled BOOLEAN DEFAULT true,
  digest_hour INTEGER DEFAULT 18, -- 18:00 (6 PM)
  digest_day_of_week INTEGER DEFAULT NULL, -- NULL = daily, 0-6 = specific day

  -- Immediate notifications (for high-priority events)
  immediate_on_mention BOOLEAN DEFAULT true,
  immediate_on_reply BOOLEAN DEFAULT true,

  -- Category filters
  notify_new_issues BOOLEAN DEFAULT true,
  notify_comments BOOLEAN DEFAULT true,
  notify_votes BOOLEAN DEFAULT false, -- too noisy

  -- Quiet hours (don't send between these hours)
  quiet_hours_start INTEGER DEFAULT 22, -- 22:00
  quiet_hours_end INTEGER DEFAULT 7,    -- 07:00

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_user_notification_prefs UNIQUE (user_id),
  CONSTRAINT digest_hour_range CHECK (digest_hour >= 0 AND digest_hour <= 23),
  CONSTRAINT quiet_hours_valid CHECK (quiet_hours_start >= 0 AND quiet_hours_start <= 23 AND quiet_hours_end >= 0 AND quiet_hours_end <= 23)
);

-- 2. Per-issue notification subscriptions (opt-in per topic)
CREATE TABLE IF NOT EXISTS issue_notification_subscriptions_852 (
  id UUID DEFAULT gen_random_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_accounts_852(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES issues_852(id) ON DELETE CASCADE,

  subscription_type TEXT NOT NULL DEFAULT 'vote', -- 'vote', 'comment', 'manual', 'author'
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_user_issue_subscription UNIQUE (user_id, issue_id)
);

-- 3. Notification queue (for pending emails)
CREATE TABLE IF NOT EXISTS notification_queue_852 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_accounts_852(id) ON DELETE CASCADE,

  notification_type TEXT NOT NULL, -- 'digest', 'immediate_comment', 'immediate_mention', 'vote_milestone'
  issue_id UUID REFERENCES issues_852(id) ON DELETE CASCADE,
  comment_id UUID, -- optional reference to comment

  -- Content snapshot (for email rendering)
  title TEXT,
  preview TEXT,
  actor_nickname TEXT, -- who triggered the notification

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced'
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Sent emails log (for tracking/bounce handling)
CREATE TABLE IF NOT EXISTS sent_emails_852 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_accounts_852(id) ON DELETE CASCADE,
  notification_queue_id UUID REFERENCES notification_queue_852(id) ON DELETE SET NULL,

  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,

  resend_message_id TEXT, -- Resend API message ID
  status TEXT NOT NULL, -- 'sent', 'delivered', 'opened', 'bounced', 'complained'

  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,

  metadata JSONB DEFAULT '{}'
);

-- 5. Update existing forum_follow_ups to include email preference
ALTER TABLE forum_follow_ups_852
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT false;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences_852(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_subscriptions_user ON issue_notification_subscriptions_852(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_subscriptions_issue ON issue_notification_subscriptions_852(issue_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_pending ON notification_queue_852(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON notification_queue_852(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sent_emails_user ON sent_emails_852(user_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_resend ON sent_emails_852(resend_message_id);

-- RLS Policies
ALTER TABLE notification_preferences_852 ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_notification_subscriptions_852 ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue_852 ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_emails_852 ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own preferences
CREATE POLICY "Users manage own notification prefs"
  ON notification_preferences_852
  FOR ALL
  USING (user_id = auth.uid());

-- Users manage own subscriptions
CREATE POLICY "Users manage own issue subscriptions"
  ON issue_notification_subscriptions_852
  FOR ALL
  USING (user_id = auth.uid());

-- Users see own notifications
CREATE POLICY "Users see own notifications"
  ON notification_queue_852
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role can manage queue
CREATE POLICY "Service role manages notification queue"
  ON notification_queue_852
  FOR ALL
  TO service_role
  USING (true);

-- Users see own sent emails
CREATE POLICY "Users see own sent emails"
  ON sent_emails_852
  FOR SELECT
  USING (user_id = auth.uid());

-- Function to get digest subscribers for a given hour
CREATE OR REPLACE FUNCTION get_digest_subscribers(target_hour INTEGER)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  nickname TEXT,
  preferences JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    np.user_id,
    ua.email,
    ua.nickname,
    jsonb_build_object(
      'daily_digest_enabled', np.daily_digest_enabled,
      'digest_hour', np.digest_hour,
      'notify_new_issues', np.notify_new_issues,
      'notify_comments', np.notify_comments
    ) as preferences
  FROM notification_preferences_852 np
  JOIN user_accounts_852 ua ON ua.id = np.user_id
  WHERE np.daily_digest_enabled = true
    AND np.digest_hour = target_hour
    AND ua.email_verified = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to queue immediate notification
CREATE OR REPLACE FUNCTION queue_immediate_notification(
  p_user_id UUID,
  p_issue_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_preview TEXT,
  p_actor_nickname TEXT
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_user_prefs notification_preferences_852%ROWTYPE;
  v_now INTEGER;
  v_in_quiet_hours BOOLEAN;
BEGIN
  -- Get user preferences
  SELECT * INTO v_user_prefs
  FROM notification_preferences_852
  WHERE user_id = p_user_id;

  -- Check quiet hours
  v_now := EXTRACT(HOUR FROM now())::INTEGER;
  v_in_quiet_hours := CASE
    WHEN v_user_prefs.quiet_hours_start > v_user_prefs.quiet_hours_end THEN
      -- e.g., 22:00 to 07:00 (overnight)
      v_now >= v_user_prefs.quiet_hours_start OR v_now < v_user_prefs.quiet_hours_end
    ELSE
      -- e.g., 01:00 to 05:00
      v_now >= v_user_prefs.quiet_hours_start AND v_now < v_user_prefs.quiet_hours_end
  END;

  -- Insert into queue (respecting quiet hours)
  INSERT INTO notification_queue_852 (
    user_id,
    notification_type,
    issue_id,
    title,
    preview,
    actor_nickname,
    scheduled_for
  ) VALUES (
    p_user_id,
    p_notification_type,
    p_issue_id,
    p_title,
    p_preview,
    p_actor_nickname,
    CASE WHEN v_in_quiet_hours THEN
      -- Schedule for end of quiet hours
      CASE
        WHEN v_user_prefs.quiet_hours_start > v_user_prefs.quiet_hours_end THEN
          -- Next day at quiet_hours_end
          date_trunc('day', now() + interval '1 day') + make_interval(hours => v_user_prefs.quiet_hours_end)
        ELSE
          -- Same day at quiet_hours_end
          date_trunc('day', now()) + make_interval(hours => v_user_prefs.quiet_hours_end)
      END
    ELSE
      now()
    END
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE notification_preferences_852 IS 'User email notification settings and digest preferences';
COMMENT ON TABLE issue_notification_subscriptions_852 IS 'Per-issue notification subscriptions (opt-in)';
COMMENT ON TABLE notification_queue_852 IS 'Pending notifications to be sent';
COMMENT ON TABLE sent_emails_852 IS 'Log of sent emails with delivery tracking';

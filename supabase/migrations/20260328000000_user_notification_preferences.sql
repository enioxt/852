-- Migration: User Notification Preferences for Issue Voting Alerts
-- Date: 2026-03-28
-- Purpose: Enable users to opt-in/out of email notifications when someone votes on issues they've participated in

-- Create notification preferences table
CREATE TABLE user_notification_preferences_852 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_accounts_852(id) ON DELETE CASCADE,

  -- Email notification settings
  notify_on_issue_votes BOOLEAN DEFAULT true,           -- Email when someone votes on an issue I participated in
  notify_on_issue_comments BOOLEAN DEFAULT true,        -- Email when someone comments on an issue I participated in
  notify_on_issue_status_change BOOLEAN DEFAULT false,  -- Email when issue status changes (future)

  -- Frequency settings
  digest_frequency TEXT DEFAULT 'immediate',            -- 'immediate', 'daily', 'weekly', or 'never'

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_notification_preferences_updated_at
BEFORE UPDATE ON user_notification_preferences_852
FOR EACH ROW
EXECUTE FUNCTION update_user_notification_preferences_updated_at();

-- Enable RLS
ALTER TABLE user_notification_preferences_852 ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own preferences
CREATE POLICY "users_can_view_own_preferences" ON user_notification_preferences_852
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

-- Users can only update their own preferences
CREATE POLICY "users_can_update_own_preferences" ON user_notification_preferences_852
  FOR UPDATE
  USING (auth.uid()::uuid = user_id);

-- Only service role can insert (via auth signup)
CREATE POLICY "service_role_can_insert_preferences" ON user_notification_preferences_852
  FOR INSERT
  WITH CHECK (true);

-- Grant access
GRANT SELECT, UPDATE ON user_notification_preferences_852 TO authenticated;
GRANT ALL ON user_notification_preferences_852 TO service_role;

-- Auto-create preferences row when a user is created
-- This will be handled in the application code during user registration,
-- but we can also use a trigger if preferred:
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_notification_preferences_852 (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_preferences_on_user_signup
AFTER INSERT ON user_accounts_852
FOR EACH ROW
EXECUTE FUNCTION create_default_notification_preferences();

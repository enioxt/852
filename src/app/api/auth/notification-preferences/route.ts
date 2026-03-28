import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/user-auth';

export const runtime = 'nodejs';

interface NotificationPreferences {
  notify_on_issue_votes: boolean;
  notify_on_issue_comments: boolean;
  notify_on_issue_status_change: boolean;
  digest_frequency: 'immediate' | 'daily' | 'weekly' | 'never';
}

/**
 * GET /api/auth/notification-preferences
 * Fetch current user's notification preferences
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const { data: preferences, error } = await supabase
      .from('user_notification_preferences_852')
      .select('notify_on_issue_votes,notify_on_issue_comments,notify_on_issue_status_change,digest_frequency')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[API] Notification preferences fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    // If no preferences exist, return defaults
    if (!preferences) {
      const defaults: NotificationPreferences = {
        notify_on_issue_votes: true,
        notify_on_issue_comments: true,
        notify_on_issue_status_change: false,
        digest_frequency: 'immediate',
      };
      return NextResponse.json(defaults);
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('[API] Error fetching notification preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/auth/notification-preferences
 * Update user's notification preferences
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { notify_on_issue_votes, notify_on_issue_comments, notify_on_issue_status_change, digest_frequency } = body;

    // Validate digest frequency
    const validFrequencies = ['immediate', 'daily', 'weekly', 'never'];
    if (digest_frequency && !validFrequencies.includes(digest_frequency)) {
      return NextResponse.json(
        { error: 'Invalid digest frequency' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Try to update, if no row exists, create it
    const { data: existing } = await supabase
      .from('user_notification_preferences_852')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;
    if (existing) {
      result = await supabase
        .from('user_notification_preferences_852')
        .update({
          ...(notify_on_issue_votes !== undefined && { notify_on_issue_votes }),
          ...(notify_on_issue_comments !== undefined && { notify_on_issue_comments }),
          ...(notify_on_issue_status_change !== undefined && { notify_on_issue_status_change }),
          ...(digest_frequency && { digest_frequency }),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select();
    } else {
      result = await supabase
        .from('user_notification_preferences_852')
        .insert({
          user_id: user.id,
          notify_on_issue_votes: notify_on_issue_votes ?? true,
          notify_on_issue_comments: notify_on_issue_comments ?? true,
          notify_on_issue_status_change: notify_on_issue_status_change ?? false,
          digest_frequency: digest_frequency ?? 'immediate',
        })
        .select();
    }

    const { error } = result;
    if (error) {
      console.error('[API] Notification preferences update error:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data?.[0] });
  } catch (error) {
    console.error('[API] Error updating notification preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

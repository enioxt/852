/**
 * Microsoft Clarity Helper — 852 Inteligência
 *
 * Utilities for tracking custom events and heatmap data with Clarity.
 * https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api
 */

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

/**
 * Track a custom event in Microsoft Clarity
 * @param eventName Name of the event (max 256 chars)
 * @param properties Optional key-value pairs (max 2048 chars total)
 */
export function trackClarityEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined' || !window.clarity) return;

  try {
    if (properties) {
      window.clarity('event', eventName, properties);
    } else {
      window.clarity('event', eventName);
    }
  } catch (error) {
    console.warn('[Clarity] Failed to track event:', error);
  }
}

/**
 * Set a custom tag/variable in Clarity
 * Useful for segmentation (e.g., user type, feature flag)
 */
export function setClarityTag(key: string, value: string | number): void {
  if (typeof window === 'undefined' || !window.clarity) return;

  try {
    window.clarity('set', key, value);
  } catch (error) {
    console.warn('[Clarity] Failed to set tag:', error);
  }
}

/**
 * Identify a user in Clarity (privacy-safe, hashed ID)
 * Only call after user consent
 */
export function identifyClarityUser(userId: string): void {
  if (typeof window === 'undefined' || !window.clarity) return;

  try {
    // Use a hashed version of the ID for privacy
    window.clarity('identify', userId);
  } catch (error) {
    console.warn('[Clarity] Failed to identify user:', error);
  }
}

/**
 * Track key user interactions for heatmap analysis
 */
export const ClarityEvents = {
  // Navigation
  NAV_CLICK: (section: string) => trackClarityEvent('nav_click', { section }),

  // Chat interactions
  CHAT_STARTED: () => trackClarityEvent('chat_started'),
  CHAT_MESSAGE_SENT: () => trackClarityEvent('chat_message_sent'),
  CHAT_AI_RESPONSE_RECEIVED: () => trackClarityEvent('chat_ai_response_received'),

  // Report flow
  REPORT_REVIEW_OPENED: () => trackClarityEvent('report_review_opened'),
  REPORT_SHARED: (method: 'pdf' | 'docx' | 'markdown' | 'whatsapp') =>
    trackClarityEvent('report_shared', { method }),
  REPORT_EXPORTED: (format: string) =>
    trackClarityEvent('report_exported', { format }),

  // Issues/Forum
  ISSUE_CREATED: () => trackClarityEvent('issue_created'),
  ISSUE_VOTED: (voteType: 'up' | 'down') =>
    trackClarityEvent('issue_voted', { voteType }),
  ISSUE_COMMENTED: () => trackClarityEvent('issue_commented'),

  // Suggestion flow
  SUGGESTION_SUBMITTED: () => trackClarityEvent('suggestion_submitted'),
  FILE_UPLOADED: (type: string) =>
    trackClarityEvent('file_uploaded', { type }),

  // Auth
  USER_REGISTERED: (method: 'email' | 'google' | 'code') =>
    trackClarityEvent('user_registered', { method }),
  USER_LOGGED_IN: (method: string) =>
    trackClarityEvent('user_logged_in', { method }),

  // Quick actions
  QUICK_ACTION_CLICKED: (action: string) =>
    trackClarityEvent('quick_action_clicked', { action }),

  // Mobile nav
  MOBILE_TAB_CLICKED: (tab: string) =>
    trackClarityEvent('mobile_tab_clicked', { tab }),
} as const;

/**
 * Heatmap zones configuration
 * Define areas of interest for Clarity heatmaps
 */
export const HeatmapZones = {
  // Header navigation
  HEADER_NAV: 'header-nav',

  // Chat interface
  CHAT_INPUT: 'chat-input',
  CHAT_MESSAGES: 'chat-messages',
  CHAT_SIDEBAR: 'chat-sidebar',

  // Landing page CTAs
  LANDING_PRIMARY_CTA: 'landing-primary-cta',
  LANDING_SECONDARY_CTA: 'landing-secondary-cta',

  // Report flow
  REPORT_REVIEW_BUTTON: 'report-review-button',
  EXPORT_MENU: 'export-menu',

  // Issues
  ISSUES_VOTE_BUTTONS: 'issues-vote-buttons',
  ISSUES_COMMENT_FORM: 'issues-comment-form',

  // Mobile navigation
  MOBILE_NAV_BAR: 'mobile-nav-bar',
} as const;

/**
 * Setup heatmap zone tracking via data attributes
 * Usage: <div data-clarity-zone="chat-input">...</div>
 */
export function setupHeatmapZones(): void {
  if (typeof window === 'undefined' || !window.clarity) return;

  // Track clicks on elements with data-clarity-zone
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const zoneElement = target.closest('[data-clarity-zone]');

    if (zoneElement) {
      const zone = zoneElement.getAttribute('data-clarity-zone');
      if (zone) {
        trackClarityEvent('zone_click', { zone, element: target.tagName });
      }
    }
  });
}

import { scanForPII, sanitizeText } from '@/lib/pii-scanner';
import { recordEvent } from '@/lib/telemetry';

type IssueNotificationKind = 'issue_created' | 'issue_voted';

interface IssueNotificationPayload {
  issueId: string;
  title?: string | null;
  category?: string | null;
  votes?: number;
}

function getPublicBaseUrl() {
  return (process.env.PUBLIC_BASE_URL || 'https://852.egos.ia.br').replace(/\/$/, '');
}

function sanitizeNotificationText(value?: string | null) {
  const input = (value || '').trim();
  if (!input) return 'Sem título informado';
  const findings = scanForPII(input);
  const sanitized = sanitizeText(input, findings).replace(/\s+/g, ' ').trim();
  return sanitized.slice(0, 180);
}

function buildIssueMessage(kind: IssueNotificationKind, payload: IssueNotificationPayload) {
  const baseUrl = getPublicBaseUrl();
  const title = sanitizeNotificationText(payload.title);
  const lines = kind === 'issue_created'
    ? [
        '🚨 852 — Nova pauta registrada',
        `Título: ${title}`,
        `Categoria: ${payload.category || 'outro'}`,
        `Issue ID: ${payload.issueId}`,
        `Link: ${baseUrl}/issues`,
      ]
    : [
        '👍 852 — Novo voto registrado',
        `Pauta: ${title}`,
        `Votos: ${payload.votes ?? 'n/d'}`,
        `Issue ID: ${payload.issueId}`,
        `Link: ${baseUrl}/issues`,
      ];

  return lines.join('\n');
}

function buildIssuePayload(kind: IssueNotificationKind, payload: IssueNotificationPayload) {
  return {
    event: kind,
    issueId: payload.issueId,
    title: sanitizeNotificationText(payload.title),
    category: payload.category || null,
    votes: payload.votes ?? null,
    url: `${getPublicBaseUrl()}/issues`,
    sentAt: new Date().toISOString(),
  };
}

async function sendWebhook(payload: Record<string, unknown>) {
  const webhookUrl = process.env.ISSUE_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return false;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (process.env.ISSUE_ALERT_WEBHOOK_SECRET) {
    headers['X-852-Webhook-Secret'] = process.env.ISSUE_ALERT_WEBHOOK_SECRET;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook ${response.status}`);
  }

  return true;
}

async function sendTelegram(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return false;

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram ${response.status}`);
  }

  return true;
}

export async function notifyIssueEvent(kind: IssueNotificationKind, payload: IssueNotificationPayload) {
  const channels: string[] = [];
  const errors: string[] = [];
  const message = buildIssueMessage(kind, payload);
  const jsonPayload = buildIssuePayload(kind, payload);

  if (process.env.ISSUE_ALERT_WEBHOOK_URL) {
    try {
      await sendWebhook({ message, ...jsonPayload });
      channels.push('webhook');
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Webhook error');
    }
  }

  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      await sendTelegram(message);
      channels.push('telegram');
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Telegram error');
    }
  }

  if (channels.length > 0) {
    await recordEvent({
      event_type: 'notification_sent',
      metadata: {
        kind,
        issueId: payload.issueId,
        channels,
      },
    });
  }

  if (errors.length > 0) {
    await recordEvent({
      event_type: 'notification_error',
      error_message: errors.join(' | ').slice(0, 240),
      metadata: {
        kind,
        issueId: payload.issueId,
      },
    });
  }
}

export function queueIssueNotification(kind: IssueNotificationKind, payload: IssueNotificationPayload) {
  void notifyIssueEvent(kind, payload);
}

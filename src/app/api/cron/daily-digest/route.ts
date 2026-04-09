/**
 * Daily Digest Cron API — 852 Inteligência
 *
 * Triggered by cron job to send daily email digests.
 * Should be called with CRON_SECRET authorization.
 */

import { getDigestSubscribers, getRecentActivityForDigest } from '@/lib/email-notifications';
import { recordEvent } from '@/lib/telemetry';

// Types for email data
interface DigestItem {
  issueId: string;
  issueTitle: string;
  commentCount?: number;
  voteDelta?: number;
}

interface EmailContent {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * POST /api/cron/daily-digest
 * Send daily digest emails to subscribers
 */
export async function POST(req: Request) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('Authorization');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret) {
      const token = authHeader?.replace('Bearer ', '');
      if (token !== expectedSecret) {
        return Response.json(
          { error: 'Não autorizado' },
          { status: 401 }
        );
      }
    }

    // Get current hour (for testing, can be passed as param)
    const { searchParams } = new URL(req.url);
    const hourParam = searchParams.get('hour');
    const currentHour = hourParam
      ? parseInt(hourParam, 10)
      : new Date().getHours();

    // Get subscribers for this hour
    const subscribers = await getDigestSubscribers(currentHour);

    if (subscribers.length === 0) {
      return Response.json({
        success: true,
        message: 'Nenhum assinante para esta hora',
        sent: 0,
        hour: currentHour,
      });
    }

    const results: Array<{ email: string; status: string; error?: string }> = [];
    let sentCount = 0;
    let failedCount = 0;

    // Send digest to each subscriber
    for (const subscriber of subscribers) {
      try {
        // Calculate time window (last 24 hours)
        const since = new Date();
        since.setHours(since.getHours() - 24);

        // Get recent activity
        const activity = await getRecentActivityForDigest(
          subscriber.userId,
          since
        );

        // Skip if no activity
        const hasActivity =
          activity.newComments.length > 0 ||
          activity.newVotes.length > 0 ||
          (subscriber.preferences.notify_new_issues &&
            activity.newIssues.length > 0);

        if (!hasActivity) {
          results.push({ email: subscriber.email, status: 'skipped_no_activity' });
          continue;
        }

        // Build email content
        const emailContent = buildDigestEmail(
          subscriber.nickname,
          activity.newComments,
          activity.newVotes,
          subscriber.preferences.notify_new_issues ? activity.newIssues : []
        );

        // Send email via Resend
        const sendResult = await sendEmail({
          to: subscriber.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        if (sendResult.success) {
          sentCount++;
          results.push({ email: subscriber.email, status: 'sent' });

          recordEvent({
            event_type: 'email_digest_sent',
            metadata: {
              userId: subscriber.userId,
              email: subscriber.email,
              newComments: activity.newComments.length,
              newVotes: activity.newVotes.length,
              newIssues: activity.newIssues.length,
            },
          });
        } else {
          failedCount++;
          results.push({
            email: subscriber.email,
            status: 'failed',
            error: sendResult.error,
          });
        }
      } catch (error) {
        failedCount++;
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        results.push({
          email: subscriber.email,
          status: 'error',
          error: errorMsg,
        });
        console.error(`[daily-digest] Failed for ${subscriber.email}:`, error);
      }
    }

    return Response.json({
      success: true,
      hour: currentHour,
      total: subscribers.length,
      sent: sentCount,
      failed: failedCount,
      results,
    });
  } catch (error) {
    console.error('[api/cron/daily-digest] error:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

/**
 * Build digest email content
 */
function buildDigestEmail(
  nickname: string,
  newComments: Array<{ issueId: string; issueTitle: string; commentCount: number }>,
  newVotes: Array<{ issueId: string; issueTitle: string; voteDelta: number }>,
  newIssues: Array<{ id: string; title: string; category: string; votes: number }>
): { subject: string; html: string; text: string } {
  const subject = `Resumo diário — ${newComments.length + newVotes.length} atualizações nos seus tópicos`;

  // Build HTML
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resumo Diário — Tira-Voz</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #dc2626; }
    .header h1 { margin: 0; color: #dc2626; font-size: 24px; }
    .greeting { margin: 20px 0; }
    .section { margin: 30px 0; }
    .section h2 { color: #dc2626; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    .item { padding: 15px; margin: 10px 0; background: #f9fafb; border-radius: 8px; }
    .item-title { font-weight: 600; color: #111827; margin-bottom: 5px; }
    .item-meta { color: #6b7280; font-size: 14px; }
    .badge { display: inline-block; padding: 2px 8px; background: #dc2626; color: white; border-radius: 4px; font-size: 12px; margin-left: 8px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📻 Tira-Voz — Resumo Diário</h1>
  </div>
  
  <div class="greeting">
    <p>Olá, <strong>${nickname}</strong>!</p>
    <p>Aqui está o que aconteceu nas últimas 24 horas nos tópicos que você acompanha:</p>
  </div>
`;

  // Comments section
  if (newComments.length > 0) {
    html += `
  <div class="section">
    <h2>💬 Novos comentários (${newComments.length})</h2>
`;
    for (const item of newComments) {
      html += `
    <div class="item">
      <div class="item-title">${item.issueTitle}</div>
      <div class="item-meta">${item.commentCount} novo${item.commentCount > 1 ? 's' : ''} comentário${item.commentCount > 1 ? 's' : ''}</div>
      <a href="https://852.egos.ia.br/issues/${item.issueId}" class="button">Ver tópico</a>
    </div>
`;
    }
    html += '  </div>';
  }

  // Votes section
  if (newVotes.length > 0) {
    const totalVotes = newVotes.reduce((sum, v) => sum + Math.abs(v.voteDelta), 0);
    html += `
  <div class="section">
    <h2>👍 Nova atividade (${totalVotes} voto${totalVotes > 1 ? 's' : ''})</h2>
`;
    for (const item of newVotes) {
      const direction = item.voteDelta > 0 ? '↑' : '↓';
      html += `
    <div class="item">
      <div class="item-title">${item.issueTitle}</div>
      <div class="item-meta">${direction} ${Math.abs(item.voteDelta)} voto${Math.abs(item.voteDelta) > 1 ? 's' : ''}</div>
    </div>
`;
    }
    html += '  </div>';
  }

  // New issues section
  if (newIssues.length > 0) {
    html += `
  <div class="section">
    <h2>📝 Novos tópicos (${newIssues.length})</h2>
`;
    for (const item of newIssues) {
      html += `
    <div class="item">
      <div class="item-title">${item.title} <span class="badge">${item.category}</span></div>
      <div class="item-meta">${item.votes} voto${item.votes !== 1 ? 's' : ''}</div>
      <a href="https://852.egos.ia.br/issues/${item.id}" class="button">Ver tópico</a>
    </div>
`;
    }
    html += '  </div>';
  }

  // Footer
  html += `
  <div class="footer">
    <p>Este é um email automático do Tira-Voz (852 Inteligência).</p>
    <p>Para gerenciar suas notificações, acesse sua <a href="https://852.egos.ia.br/conta">Conta</a>.</p>
    <p style="margin-top: 20px; font-size: 11px;">
      Polícia Civil de Minas Gerais — Inteligência Institucional
    </p>
  </div>
</body>
</html>
`;

  // Build text version
  let text = `Tira-Voz — Resumo Diário\n\n`;
  text += `Olá, ${nickname}!\n\n`;
  text += `Aqui está o que aconteceu nas últimas 24 horas:\n\n`;

  if (newComments.length > 0) {
    text += `NOVOS COMENTÁRIOS (${newComments.length}):\n`;
    for (const item of newComments) {
      text += `- ${item.issueTitle}: ${item.commentCount} comentário(s)\n`;
      text += `  https://852.egos.ia.br/issues/${item.issueId}\n\n`;
    }
  }

  if (newVotes.length > 0) {
    text += `NOVA ATIVIDADE:\n`;
    for (const item of newVotes) {
      const direction = item.voteDelta > 0 ? '+' : '-';
      text += `- ${item.issueTitle}: ${direction}${Math.abs(item.voteDelta)} voto(s)\n`;
    }
    text += '\n';
  }

  if (newIssues.length > 0) {
    text += `NOVOS TÓPICOS (${newIssues.length}):\n`;
    for (const item of newIssues) {
      text += `- [${item.category}] ${item.title} (${item.votes} votos)\n`;
      text += `  https://852.egos.ia.br/issues/${item.id}\n\n`;
    }
  }

  text += `---\n`;
  text += `Gerenciar notificações: https://852.egos.ia.br/conta\n`;
  text += `Tira-Voz — Inteligência Institucional PC-MG\n`;

  return { subject, html, text };
}

/**
 * Send email via Resend API
 */
async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return { success: false, error: 'RESEND_API_KEY não configurada' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Tira-Voz <noreply@852.egos.ia.br>',
        to,
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Resend error: ${error}` };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: msg };
  }
}

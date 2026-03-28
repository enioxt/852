/**
 * Email template for issue voting notifications
 * Sent when someone votes on an issue the user has participated in
 */

interface IssueVoteEmailContext {
  recipientName: string;
  recipientEmail: string;
  issueTitle: string;
  issueId: string;
  issueCategory?: string | null;
  currentVotes: number;
  votedBy?: string;
  voteType: 'up' | 'down';
  appBaseUrl: string;
}

export function generateIssueVoteEmailHtml(context: IssueVoteEmailContext): string {
  const issueUrl = `${context.appBaseUrl}/papo-de-corredor?issue=${context.issueId}`;
  const voteLabel = context.voteType === 'up' ? '👍 Apoiou' : '👎 Discordou';
  const categoryBadge = context.issueCategory
    ? `<span style="display: inline-block; background: #e5e7eb; color: #374151; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-right: 8px;">${context.issueCategory}</span>`
    : '';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova atividade em um tópico</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: #f9fafb;
      padding: 20px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .header p {
      font-size: 14px;
      opacity: 0.8;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 14px;
      color: #374151;
      margin-bottom: 24px;
    }
    .issue-card {
      border-left: 4px solid #3b82f6;
      background: #f3f4f6;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .issue-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
      word-break: break-word;
    }
    .issue-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .vote-indicator {
      display: inline-block;
      padding: 6px 12px;
      background: #dbeafe;
      color: #1e40af;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .stats {
      display: flex;
      gap: 16px;
      margin-top: 12px;
    }
    .stat {
      font-size: 12px;
      color: #6b7280;
    }
    .stat-value {
      font-weight: 600;
      color: #1f2937;
    }
    .action-button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      margin: 24px 0;
      transition: background 0.2s;
    }
    .action-button:hover {
      background: #2563eb;
    }
    .footer {
      background: #f9fafb;
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    .footer-link {
      color: #3b82f6;
      text-decoration: none;
    }
    .footer-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nova atividade em um tópico</h1>
      <p>Você está recebendo este email porque participa deste tópico</p>
    </div>

    <div class="content">
      <div class="greeting">
        Olá <strong>${context.recipientName || 'colega'}</strong>,
      </div>

      <p style="color: #374151; margin-bottom: 24px;">
        Alguém acaba de ${context.voteType === 'up' ? 'apoiar' : 'discordar de'} um tópico que você participou no Papo de Corredor.
      </p>

      <div class="issue-card">
        <div class="issue-title">${escapeHtml(context.issueTitle)}</div>

        <div class="issue-meta">
          ${categoryBadge}
          <span class="vote-indicator">${voteLabel}</span>
        </div>

        <div class="stats">
          <div class="stat">
            Total de apoios: <span class="stat-value">${context.currentVotes}</span>
          </div>
        </div>
      </div>

      <p style="color: #374151; margin-bottom: 16px;">
        Confira a discussão completa e veja o que mais os colegas estão falando sobre este tópico.
      </p>

      <a href="${issueUrl}" class="action-button">Ver tópico no Papo de Corredor</a>

      <p style="color: #6b7280; font-size: 13px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
        <strong>Controle suas preferências:</strong> Se não deseja mais receber notificações deste tipo, você pode desativar nas configurações da sua conta.
      </p>
    </div>

    <div class="footer">
      <p>
        Tira-Voz — Plataforma anônima para policiais civis de MG
      </p>
      <p style="margin-top: 8px;">
        <a href="${context.appBaseUrl}" class="footer-link">Acessar Tira-Voz</a>
      </p>
      <p style="margin-top: 12px; opacity: 0.7;">
        Você recebeu este email porque tem uma conta ativa no Tira-Voz.
        <br>
        <a href="${context.appBaseUrl}/conta" class="footer-link">Gerenciar preferências de email</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateIssueVoteEmailText(context: IssueVoteEmailContext): string {
  const issueUrl = `${context.appBaseUrl}/papo-de-corredor?issue=${context.issueId}`;
  const voteLabel = context.voteType === 'up' ? 'apoiou' : 'discordou';

  return `
Olá ${context.recipientName || 'colega'},

Alguém acaba de ${voteLabel} um tópico que você participou no Papo de Corredor.

TÓPICO: ${context.issueTitle}
${context.issueCategory ? `CATEGORIA: ${context.issueCategory}` : ''}
TOTAL DE APOIOS: ${context.currentVotes}

Confira a discussão completa:
${issueUrl}

---

Tira-Voz — Plataforma anônima para policiais civis de MG

Você recebeu este email porque tem uma conta ativa no Tira-Voz.
Gerenciar preferências: ${context.appBaseUrl}/conta
  `.trim();
}

/**
 * Escape HTML special characters to prevent injection
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export type { IssueVoteEmailContext };

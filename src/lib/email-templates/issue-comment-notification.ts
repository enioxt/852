/**
 * Email template for issue comment notifications
 * Sent when someone comments on an issue the user has participated in
 */

interface IssueCommentEmailContext {
  recipientName: string;
  recipientEmail: string;
  issueTitle: string;
  issueId: string;
  issueCategory?: string | null;
  appBaseUrl: string;
}

export function generateIssueCommentEmailHtml(context: IssueCommentEmailContext): string {
  const issueUrl = `${context.appBaseUrl}/papo-de-corredor?issue=${context.issueId}`;
  const categoryBadge = context.issueCategory
    ? `<span style="display: inline-block; background: #e5e7eb; color: #374151; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-right: 8px;">${context.issueCategory}</span>`
    : '';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo comentário em um tópico</title>
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
    .header h1 { font-size: 24px; margin-bottom: 4px; font-weight: 600; }
    .header p { font-size: 14px; opacity: 0.8; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 14px; color: #374151; margin-bottom: 24px; }
    .issue-card {
      border-left: 4px solid #f59e0b;
      background: #fffbeb;
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
    .comment-badge {
      display: inline-block;
      padding: 6px 12px;
      background: #fef3c7;
      color: #92400e;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .action-button {
      display: inline-block;
      background: #f59e0b;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      margin: 24px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    .footer-link { color: #3b82f6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Novo comentário em um tópico</h1>
      <p>Você está recebendo este email porque participa deste tópico</p>
    </div>

    <div class="content">
      <div class="greeting">
        Olá <strong>${context.recipientName || 'colega'}</strong>,
      </div>

      <p style="color: #374151; margin-bottom: 24px;">
        Um colega acabou de comentar em um tópico que você participou no Papo de Corredor.
      </p>

      <div class="issue-card">
        <div class="issue-title">${escapeHtml(context.issueTitle)}</div>
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          ${categoryBadge}
          <span class="comment-badge">💬 Novo comentário</span>
        </div>
      </div>

      <p style="color: #374151; margin-bottom: 16px;">
        Acompanhe a discussão e contribua com sua perspectiva.
      </p>

      <a href="${issueUrl}" class="action-button">Ver comentários no Papo de Corredor</a>

      <p style="color: #6b7280; font-size: 13px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
        <strong>Controle suas preferências:</strong> Para parar de receber estas notificações, ajuste nas configurações da sua conta.
      </p>
    </div>

    <div class="footer">
      <p>Tira-Voz — Plataforma anônima para policiais civis de MG</p>
      <p style="margin-top: 8px;">
        <a href="${context.appBaseUrl}" class="footer-link">Acessar Tira-Voz</a>
      </p>
      <p style="margin-top: 12px; opacity: 0.7;">
        <a href="${context.appBaseUrl}/conta" class="footer-link">Gerenciar preferências de email</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateIssueCommentEmailText(context: IssueCommentEmailContext): string {
  const issueUrl = `${context.appBaseUrl}/papo-de-corredor?issue=${context.issueId}`;

  return `
Olá ${context.recipientName || 'colega'},

Um colega acabou de comentar em um tópico que você participou no Papo de Corredor.

TÓPICO: ${context.issueTitle}
${context.issueCategory ? `CATEGORIA: ${context.issueCategory}` : ''}

Acompanhe a discussão:
${issueUrl}

---

Tira-Voz — Plataforma anônima para policiais civis de MG

Gerenciar preferências: ${context.appBaseUrl}/conta
  `.trim();
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export type { IssueCommentEmailContext };

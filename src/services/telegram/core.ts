export interface TelegramAdminReport {
  title: string;
  priority?: string;
  category?: string;
  intro?: string;
  summary?: { label: string; value: unknown }[];
  details?: string[];
  diagnosis?: string[];
  nextSteps?: string[];
  [key: string]: unknown;
}

export async function sendTelegramAdminReport(report: TelegramAdminReport): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!botToken || !chatId) { console.log('[Telegram] Skipped — env vars not set'); return; }
  const lines = [
    `*${report.title}*`,
    report.intro || '',
    ...(report.summary?.map(s => `• ${s.label}: ${s.value}`) ?? []),
  ].filter(Boolean);
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), parse_mode: 'Markdown' }),
  });
}

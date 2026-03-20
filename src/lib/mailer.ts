import nodemailer from 'nodemailer';

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendMailParams): Promise<{ success: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"Tira-Voz" <no-reply@egos.ia.br>';

  if (!host || !user || !pass) {
    console.warn('[852-mailer] SMTP credentials not fully configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Email skipped.');
    return { success: false, error: 'Configuração SMTP ausente no servidor.' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
      tls: {
          rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    console.log(`[852-mailer] Message sent: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('[852-mailer] Failed to send email:', error instanceof Error ? error.message : error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown SMTP error' };
  }
}

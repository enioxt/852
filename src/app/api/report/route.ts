import { generateText } from 'ai';
import { getModelConfig, hasAvailableProvider } from '@/lib/ai-provider';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { buildHtmlReportPrompt } from '@/lib/prompt';

export const maxDuration = 60;

const REPORT_LIMIT = {
  limit: 6,
  windowMs: 10 * 60 * 1000,
};

export async function POST(req: Request) {
  try {
    if (!hasAvailableProvider()) {
      return new Response(JSON.stringify({ error: 'Nenhum provedor de IA está configurado no servidor.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ip = getClientIp(req.headers);
    const rate = checkRateLimit(`report:${ip}`, REPORT_LIMIT.limit, REPORT_LIMIT.windowMs);

    if (!rate.allowed) {
      return new Response(JSON.stringify({
        error: 'Muitos relatórios em pouco tempo. Aguarde alguns minutos.',
        resetAt: rate.resetAt,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rate.remaining),
          'X-RateLimit-Reset': String(rate.resetAt),
        },
      });
    }

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt é obrigatório' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { provider, modelId } = getModelConfig('html_report');

    const { text } = await generateText({
      model: provider.chat(modelId),
      system: buildHtmlReportPrompt(),
      prompt: `Gere um relatório HTML completo para: ${prompt}`,
      temperature: 0.5,
    });

    // Extract HTML from response (handle markdown code blocks)
    let html = text;
    const htmlMatch = text.match(/```html?\s*([\s\S]*?)```/);
    if (htmlMatch) {
      html = htmlMatch[1].trim();
    } else if (!text.trim().startsWith('<!DOCTYPE') && !text.trim().startsWith('<html')) {
      // Wrap in basic HTML if not already
      html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório 852</title></head><body style="background:#0f172a;color:#e2e8f0;font-family:sans-serif;padding:2rem;">${text}</body></html>`;
    }

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Model-Id': modelId,
      },
    });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    console.error('Report API Error:', detail);
    return new Response(JSON.stringify({ error: 'Falha ao gerar relatório', detail }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

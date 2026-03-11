import { generateText } from 'ai';
import { getModelConfig, hasAvailableProvider } from '@/lib/ai-provider';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const maxDuration = 60;

const REPORT_LIMIT = {
  limit: 6,
  windowMs: 10 * 60 * 1000,
};

const REPORT_SYSTEM_PROMPT = `Você é um gerador de relatórios HTML para a plataforma 852 Inteligência.
Ao receber um prompt do usuário, gere um relatório HTML COMPLETO e profissional.

REGRAS:
1. Retorne APENAS o código HTML completo (com <!DOCTYPE html>, <head>, <body>)
2. Use CSS inline ou <style> no <head> — NÃO use links externos de CSS
3. Design: dark mode (bg #0f172a, text #e2e8f0), fontes sans-serif, visual profissional estilo Palantir
4. Inclua: título, data/hora, seções com ícones Unicode, gráficos em texto/ASCII se necessário
5. O HTML deve ser auto-contido e renderizável standalone
6. NUNCA inclua dados reais de PII — use dados fictícios se necessário
7. Rodapé: "Relatório gerado por 852 Inteligência — EGOS Ecosystem"
8. Responsivo (mobile-friendly)

ESTILO VISUAL:
- Header com gradiente azul
- Cards com borda sutil
- Tabelas estilizadas
- Badges coloridos para prioridades (Crítica=vermelho, Alta=laranja, Média=amarelo, Baixa=verde)`;

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
      system: REPORT_SYSTEM_PROMPT,
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

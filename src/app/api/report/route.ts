import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const maxDuration = 60;

function getProvider() {
  const key = process.env.DASHSCOPE_API_KEY;
  if (key && key !== 'your_dashscope_api_key_here') {
    return createOpenAI({
      apiKey: key,
      baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    });
  }
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    return createOpenAI({
      apiKey: orKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }
  return createOpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
}

function getModelId() {
  if (process.env.DASHSCOPE_API_KEY && process.env.DASHSCOPE_API_KEY !== 'your_dashscope_api_key_here') return 'qwen-plus';
  if (process.env.OPENROUTER_API_KEY) return 'google/gemini-2.0-flash-001';
  return 'gpt-4o-mini';
}

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
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt é obrigatório' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const provider = getProvider();
    const modelId = getModelId();

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
  } catch (error: any) {
    console.error('Report API Error:', error?.message || error);
    return new Response(JSON.stringify({ error: 'Falha ao gerar relatório', detail: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

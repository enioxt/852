import { generateText } from 'ai';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getModelConfig, hasAvailableProvider } from '@/lib/ai-provider';
import { recordEvent } from '@/lib/telemetry';
import { buildReviewPrompt } from '@/lib/prompt';
import { ensureConfigLoaded } from '@/lib/config-store';

export const maxDuration = 30;

const REVIEW_LIMIT = { limit: 6, windowMs: 10 * 60 * 1000 };

export async function POST(req: Request) {
  await ensureConfigLoaded();
  try {
    if (!hasAvailableProvider()) {
      return new Response(JSON.stringify({ error: 'Nenhum provedor de IA configurado.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ip = getClientIp(req.headers);
    const rate = checkRateLimit(`review:${ip}`, REVIEW_LIMIT.limit, REVIEW_LIMIT.windowMs);

    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: 'Muitas revisões em pouco tempo. Aguarde.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhuma mensagem para analisar.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Format conversation for analysis
    const conversationText = messages
      .slice(-20)
      .map((m: { role: string; content: string }) =>
        `[${m.role === 'user' ? 'Policial' : '852-IA'}]: ${m.content.slice(0, 2000)}`
      )
      .join('\n\n');

    const { provider, modelId } = getModelConfig('review');

    const result = await generateText({
      model: provider.chat(modelId),
      system: buildReviewPrompt(),
      messages: [{ role: 'user', content: `Analise esta conversa e responda APENAS com JSON válido:\n\n${conversationText}` }],
      temperature: 0.2,
    });

    recordEvent({
      event_type: 'report_review',
      model_id: modelId,
      status_code: 200,
      metadata: { type: 'conversation_review', messageCount: messages.length },
    });

    // Extract and validate JSON from response
    let jsonText = result.text.trim();
    // Strip markdown fences if present
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    // Find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Resposta inválida do agente. Tente novamente.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sanitize common JSON issues from LLMs
    let cleaned = jsonMatch[0]
      .replace(/[\r\n]+/g, ' ')          // Remove newlines inside JSON
      .replace(/,\s*}/g, '}')             // Trailing commas
      .replace(/,\s*]/g, ']')             // Trailing commas in arrays
      .replace(/'/g, '"')                 // Single quotes → double
      .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":'); // Unquoted keys

    try {
      const parsed = JSON.parse(cleaned);
      
      if (parsed.isTrivial) {
        return new Response(JSON.stringify({ error: 'A conversa não contém contexto tático ou operacional suficiente para gerar um relatório de inteligência.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Erro ao processar análise. Tente novamente.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    recordEvent({ event_type: 'report_error', error_message: detail, status_code: 500 });
    return new Response(JSON.stringify({ error: 'Falha na revisão.', detail }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

import { streamText } from 'ai';
import { agentPrompt } from '@/lib/prompt';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getProvider, getModelId, getProviderLabel, hasAvailableProvider, PRICING } from '@/lib/ai-provider';
import { recordChatCompletion, recordRateLimitHit, recordChatError, recordEvent } from '@/lib/telemetry';
import { validateAndLog } from '@/lib/atrian';

export const maxDuration = 60;

const CHAT_LIMIT = {
  limit: 12,
  windowMs: 5 * 60 * 1000,
};

type IncomingMessage = {
  role: 'user' | 'assistant' | 'system';
  content?: string;
  parts?: Array<{ type?: string; text?: string }>;
};

function getMessageText(message: IncomingMessage) {
  if (typeof message.content === 'string' && message.content.trim()) return message.content.trim();
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter(part => part.type === 'text' && typeof part.text === 'string')
      .map(part => part.text?.trim() || '')
      .join('')
      .trim();
  }
  return '';
}

function sanitizeMessages(messages: unknown) {
  if (!Array.isArray(messages)) return [];

  return messages
    .slice(-12)
    .filter((message): message is IncomingMessage => {
      if (!message || typeof message !== 'object') return false;
      const role = (message as IncomingMessage).role;
      return role === 'user' || role === 'assistant' || role === 'system';
    })
    .map(message => ({
      role: message.role,
      content: getMessageText(message).slice(0, 4000),
    }))
    .filter(message => message.content.length > 0);
}

export async function POST(req: Request) {
  try {
    if (!hasAvailableProvider()) {
      recordEvent({ event_type: 'provider_unavailable', status_code: 503 });
      return new Response(JSON.stringify({ error: 'Nenhum provedor de IA está configurado no servidor.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ip = getClientIp(req.headers);
    const rate = checkRateLimit(`chat:${ip}`, CHAT_LIMIT.limit, CHAT_LIMIT.windowMs);

    if (!rate.allowed) {
      recordRateLimitHit(ip, '/api/chat');
      return new Response(JSON.stringify({
        error: 'Muitas mensagens em pouco tempo. Aguarde alguns minutos antes de tentar novamente.',
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

    const body = await req.json();
    const messages = sanitizeMessages(body?.messages);

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhuma mensagem válida foi enviada.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rate.remaining),
          'X-RateLimit-Reset': String(rate.resetAt),
        },
      });
    }

    const provider = getProvider();
    const modelId = getModelId();
    const providerLabel = getProviderLabel();
    const pricing = PRICING[modelId] || { input: 0, output: 0 };

    const result = streamText({
      model: provider.chat(modelId),
      system: agentPrompt,
      messages,
      temperature: 0.7,
      onFinish: async ({ text, usage }) => {
        const inputTokens = usage?.inputTokens || 0;
        const outputTokens = usage?.outputTokens || 0;
        const cost = pricing.free ? 0 : (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
        recordChatCompletion({
          modelId, provider: providerLabel,
          tokensIn: inputTokens, tokensOut: outputTokens,
          costUsd: cost, clientIp: ip,
        });
        // ATRiAN: validate completed response and log violations
        if (text) {
          validateAndLog(text, ip);
        }
      },
    });

    return result.toTextStreamResponse({
      headers: {
        'X-Model-Id': modelId,
        'X-Provider': providerLabel,
        'X-Model-Free': pricing.free ? 'true' : 'false',
        'X-RateLimit-Remaining': String(rate.remaining),
        'X-RateLimit-Reset': String(rate.resetAt),
      },
    });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    recordChatError(detail, getClientIp(req.headers));
    return new Response(JSON.stringify({ error: 'Falha ao processar a mensagem.', detail }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

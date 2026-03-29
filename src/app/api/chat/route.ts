import { streamText } from 'ai';
import { buildAgentPrompt } from '@/lib/prompt';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getModelConfig, hasAvailableProvider } from '@/lib/ai-provider';
import { recordChatCompletion, recordRateLimitHit, recordChatError, recordEvent } from '@/lib/telemetry';
import { validateAndLog } from '@/lib/atrian';
import { getCurrentUser } from '@/lib/user-auth';
import { getConversationMemory } from '@/lib/conversation-memory';
import { getIdentityKey } from '@/lib/session';
import { ensureConfigLoaded } from '@/lib/config-store';

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
    .map(message => {
      const rawText = getMessageText(message).slice(0, 32000);
      const isUser = message.role === 'user';
      let content = rawText;
      
      // Early Deep Atrian Layer: Mask PII from user inputs before LLM ingests it
      if (isUser && rawText.length > 0) {
        // Only require pii-scanner when needed to avoid circular logic or initialization issues
        const { scanForPII, sanitizeText } = require('@/lib/pii-scanner');
        const findings = scanForPII(rawText);
        if (findings.length > 0) {
          content = sanitizeText(rawText, findings);
        }
      }

      return {
        role: message.role,
        content,
      };
    })
    .filter(message => message.content.length > 0);
}

export async function POST(req: Request) {
  await ensureConfigLoaded();
  try {
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
    const sessionHash = req.headers.get('x-session-hash');
    const user = await getCurrentUser();
    const identityKey = getIdentityKey(sessionHash, user?.id);
    const memoryBlock = await getConversationMemory(identityKey);

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

    if (!hasAvailableProvider()) {
      recordEvent({ event_type: 'provider_unavailable', status_code: 503 });
      return new Response(JSON.stringify({ error: 'Nenhum provedor de IA está configurado no servidor.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let { provider, modelId, providerLabel, pricing, routingReason } = getModelConfig('chat');

    // Dynamic Context Orchestration (Document Pipeline)
    const totalChars = messages.reduce((acc, msg) => acc + msg.content.length, 0);
    
    if (totalChars > 12000) {
      // Deep Tier: Huge payload (e.g. pasted long document)
      const configObj = getModelConfig('intelligence_report');
      provider = configObj.provider;
      modelId = configObj.modelId;
      providerLabel = configObj.providerLabel;
      pricing = configObj.pricing;
      routingReason = 'Tier Deep: Payload massivo detectado (>12k chars). Roteado dinamicamente para modelo de alto contexto/análise profunda.';
    } else if (totalChars > 2500) {
      // Balanced Tier: Normal conversation / medium context
      const configObj = getModelConfig('chat');
      provider = configObj.provider;
      modelId = configObj.modelId;
      providerLabel = configObj.providerLabel;
      pricing = configObj.pricing;
      routingReason = 'Tier Balanced: Contexto moderado detectado. Roteado para modelo de chat principal.';
    } else {
      // Fast Tier: Quick interactions, small context
      const configObj = getModelConfig('review'); // Fast Auxiliary models like Gemini Flash
      provider = configObj.provider;
      modelId = configObj.modelId;
      providerLabel = configObj.providerLabel;
      pricing = configObj.pricing;
      routingReason = 'Tier Fast: Mensagem curta/rápida detectada (<2500 chars). Roteado dinamicamente para modelo de fallback ultrarrápido.';
    }

    const result = streamText({
      model: provider.chat(modelId),
      system: buildAgentPrompt(memoryBlock),
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
        'X-Model-Routing': routingReason,
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

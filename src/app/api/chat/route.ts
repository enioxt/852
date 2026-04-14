import { streamText } from 'ai';
import { buildAgentPrompt } from '@/lib/prompt';
import { checkRateLimit, getClientIp, checkIdentityBudget } from '@/lib/rate-limit';
import { getModelConfig, hasAvailableProvider } from '@/lib/ai-provider';
import { recordChatCompletion, recordRateLimitHit, recordChatError, recordEvent } from '@/lib/telemetry';
import { filterChunk, validateAndLog } from '@/lib/atrian';
import {
  RollingBuffer,
  StreamingValidator,
  OutputGate,
  ATRIAN_V2_RULES,
} from '@/lib/atrian-v2';
import { getCurrentUser } from '@/lib/user-auth';
import { getConversationMemory } from '@/lib/conversation-memory';
import { getIdentityKey } from '@/lib/session';
import {
  detectHesitation,
  getProactiveSuggestions,
  formatSuggestionsForChat,
  generateHesitationHelp,
  shouldSuggestExternalLLM,
  getExternalLLMSuggestion,
} from '@/lib/proactive-suggestions';
import {
  INSTITUTIONAL_SEARCH_TOOL,
  LEGAL_SEARCH_TOOL,
  institutionalSearch,
  formatToolResults,
} from '@/lib/ai-tools';

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

    // CHAT-008: per-identity budget (on top of per-IP limit)
    const budget = checkIdentityBudget(identityKey);
    if (!budget.allowed) {
      recordRateLimitHit(identityKey ?? ip, '/api/chat');
      return new Response(JSON.stringify({
        error: 'Limite de mensagens por sessão atingido. Tente novamente em alguns minutos.',
        resetAt: budget.resetAt,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(budget.resetAt),
          'X-Budget-Tier': budget.tier,
        },
      });
    }

    const memoryBlock = await getConversationMemory(identityKey);

    // Proactive suggestions: detect hesitation or complex queries
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    let proactiveContext = '';

    if (lastUserMessage) {
      // Check for hesitation and provide help
      if (detectHesitation(lastUserMessage.content)) {
        proactiveContext = generateHesitationHelp();
      }
      // Check for complex queries and suggest external LLM
      else if (shouldSuggestExternalLLM(lastUserMessage.content)) {
        proactiveContext = getExternalLLMSuggestion();
      }
      // Check for topic suggestions based on keywords
      else {
        const suggestions = getProactiveSuggestions(lastUserMessage.content);
        if (suggestions.length > 0) {
          proactiveContext = formatSuggestionsForChat(suggestions);
        }
      }
    }

    // Build enhanced system prompt with proactive context
    const systemPrompt = buildAgentPrompt(memoryBlock) +
      (proactiveContext ? `\n\n## CONTEXTO ADICIONAL\n${proactiveContext}` : '');

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
      system: systemPrompt,
      messages,
      temperature: 0.7,
      abortSignal: req.signal, // CHAT-007: stop billing when client disconnects
      tools: {
        institutional_search: {
          description: INSTITUTIONAL_SEARCH_TOOL.description,
          inputSchema: INSTITUTIONAL_SEARCH_TOOL.parameters,
          execute: async ({ query, category, limit }: { query: string; category: string; limit: number }) => {
            const results = await institutionalSearch(query, category, limit);
            recordEvent({
              event_type: 'tool_use_institutional_search',
              metadata: { query, category, resultCount: results.length },
            });
            return formatToolResults('institutional_search', results);
          },
        },
        legal_search: {
          description: LEGAL_SEARCH_TOOL.description,
          inputSchema: LEGAL_SEARCH_TOOL.parameters,
          execute: async ({ query, source }: { query: string; source: string }) => {
            const results = await institutionalSearch(query, source, 3);
            recordEvent({
              event_type: 'tool_use_legal_search',
              metadata: { query, source },
            });
            return formatToolResults('legal_search', results);
          },
        },
      },
      onFinish: async ({ text, usage }) => {
        const inputTokens = usage?.inputTokens || 0;
        const outputTokens = usage?.outputTokens || 0;
        const cost = pricing.free ? 0 : (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
        recordChatCompletion({
          modelId, provider: providerLabel,
          tokensIn: inputTokens, tokensOut: outputTokens,
          costUsd: cost, clientIp: ip,
        });
        // ATRiAN: validate completed response and log violations (post-hoc, full text)
        if (text) {
          validateAndLog(text, ip);
        }
      },
    });

    // CHAT-001 + CHAT-011: Stream-time ATRiAN validation
    // v1: Simple filterChunk | v2: RollingBuffer + StreamingValidator (when enabled)
    const ATRIAN_V2_ENABLED = process.env.ATRIAN_V2_ENABLED === 'true';

    let atrianTransform: TransformStream<string, string>;

    if (ATRIAN_V2_ENABLED) {
      // ATRiAN v2: Full streaming validation with RollingBuffer
      const validator = new StreamingValidator({
        rules: ATRIAN_V2_RULES,
        onViolation: (result) => {
          recordEvent({
            event_type: 'atrian_v2_violation',
            metadata: {
              ruleId: result.ruleId,
              severity: result.severity,
              action: result.action,
            },
          });
        },
      });

      const gate = new OutputGate({ validator, bufferSize: 200 });

      atrianTransform = new TransformStream<string, string>({
        transform: async (chunk, controller) => {
          const decision = await gate.processChunk(chunk);

          if (decision.status === 'closed') {
            // Abort streaming on critical violation
            controller.error(new Error('ATRiAN v2: Critical violation detected'));
            return;
          }

          if (decision.output) {
            controller.enqueue(decision.output);
          }
          // If null, chunk is blocked (don't enqueue)
        },
        flush: () => {
          // Reset gate for next conversation
          gate.reset();
        },
      });
    } else {
      // ATRiAN v1: Simple pattern matching (legacy)
      atrianTransform = new TransformStream<string, string>({
        transform(chunk, controller) {
          controller.enqueue(filterChunk(chunk));
        },
      });
    }

    return new Response(
      result.textStream.pipeThrough(atrianTransform).pipeThrough(new TextEncoderStream()),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Model-Id': modelId,
          'X-Provider': providerLabel,
          'X-Model-Free': pricing.free ? 'true' : 'false',
          'X-Model-Routing': routingReason,
          'X-RateLimit-Remaining': String(rate.remaining),
          'X-RateLimit-Reset': String(rate.resetAt),
        },
      }
    );
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    recordChatError(detail, getClientIp(req.headers));
    return new Response(JSON.stringify({ error: 'Falha ao processar a mensagem.', detail }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

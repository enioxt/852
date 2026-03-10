import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { agentPrompt } from '@/lib/prompt';

export const maxDuration = 60;

const PRICING: Record<string, { input: number; output: number; free?: boolean }> = {
  'qwen-plus': { input: 0.0008, output: 0.002 },
  'google/gemini-2.0-flash-001': { input: 0, output: 0, free: true },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
};

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

function getProviderLabel() {
  if (process.env.DASHSCOPE_API_KEY && process.env.DASHSCOPE_API_KEY !== 'your_dashscope_api_key_here') return 'Alibaba DashScope';
  if (process.env.OPENROUTER_API_KEY) return 'OpenRouter';
  return 'OpenAI';
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const provider = getProvider();
    const modelId = getModelId();
    const providerLabel = getProviderLabel();
    const pricing = PRICING[modelId] || { input: 0, output: 0 };

    const result = streamText({
      model: provider.chat(modelId),
      system: agentPrompt,
      messages,
      temperature: 0.7,
      onFinish: async ({ usage }) => {
        const inputTokens = usage?.inputTokens || 0;
        const outputTokens = usage?.outputTokens || 0;
        const cost = pricing.free ? 0 : (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
        console.log(`[852] model=${modelId} provider=${providerLabel} in=${inputTokens} out=${outputTokens} cost=$${cost.toFixed(6)}`);
      },
    });

    return result.toUIMessageStreamResponse({
      headers: {
        'X-Model-Id': modelId,
        'X-Provider': providerLabel,
        'X-Model-Free': pricing.free ? 'true' : 'false',
      },
    });
  } catch (error: any) {
    console.error('Chat API Error:', error?.message || error);
    return new Response(JSON.stringify({ error: 'Falha ao processar a mensagem.', detail: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

import { createOpenAI } from '@ai-sdk/openai';

export const PRICING: Record<string, { input: number; output: number; free?: boolean }> = {
  'google/gemini-2.0-flash-001': { input: 0.0001, output: 0.0004 },
  'google/gemini-2.5-pro':       { input: 0.0025, output: 0.0100 },
  'gpt-4o-mini':                 { input: 0.00015, output: 0.0006 },
};

export type ModelTask =
  | 'chat'
  | 'review'
  | 'html_report'
  | 'intelligence_report'
  | 'conversation_summary'
  | 'name_validation'
  | 'correlation'
  | 'news_summarization';

export interface ModelConfig {
  modelId: string;
  provider: ReturnType<typeof createOpenAI>;
  providerLabel: string;
  pricing: { input: number; output: number; free?: boolean };
  routingReason: string;
}

function hasOpenRouter() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

function createOpenRouterProvider() {
  return createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseURL: 'https://openrouter.ai/api/v1',
  });
}

function createOpenAIProvider() {
  return createOpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
}

export function hasAvailableProvider() {
  return Boolean(hasOpenRouter() || process.env.OPENAI_API_KEY);
}

export function getModelConfig(task: ModelTask = 'chat'): ModelConfig {
  if (hasOpenRouter()) {
    const modelId = 'google/gemini-2.0-flash-001';
    const pricing = PRICING[modelId] || { input: 0.0001, output: 0.0004 };

    const routingReasons: Partial<Record<ModelTask, string>> = {
      intelligence_report: 'Relatório de inteligência via OpenRouter gemini-2.0-flash-001.',
      name_validation:     'Validação de nome via OpenRouter gemini-2.0-flash-001.',
      news_summarization:  'Sumarização de notícias via OpenRouter gemini-2.0-flash-001.',
      review:              'Revisão via OpenRouter gemini-2.0-flash-001.',
      html_report:         'HTML report via OpenRouter gemini-2.0-flash-001.',
      conversation_summary:'Resumo de conversa via OpenRouter gemini-2.0-flash-001.',
      correlation:         'Correlação via OpenRouter gemini-2.0-flash-001.',
    };

    return {
      modelId,
      provider: createOpenRouterProvider(),
      providerLabel: 'OpenRouter',
      pricing,
      routingReason: routingReasons[task] ?? 'OpenRouter gemini-2.0-flash-001 (primary).',
    };
  }

  const modelId = 'gpt-4o-mini';
  return {
    modelId,
    provider: createOpenAIProvider(),
    providerLabel: 'OpenAI',
    pricing: PRICING[modelId] || { input: 0, output: 0 },
    routingReason: 'Fallback final para compatibilidade.',
  };
}

export function getProvider(task: ModelTask = 'chat') {
  return getModelConfig(task).provider;
}

export function getModelId(task: ModelTask = 'chat') {
  return getModelConfig(task).modelId;
}

export function getProviderLabel(task: ModelTask = 'chat') {
  return getModelConfig(task).providerLabel;
}

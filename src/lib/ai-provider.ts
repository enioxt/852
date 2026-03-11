import { createOpenAI } from '@ai-sdk/openai';

export const PRICING: Record<string, { input: number; output: number; free?: boolean }> = {
  'qwen-plus': { input: 0.0008, output: 0.002 },
  'qwen-max': { input: 0.0016, output: 0.007 },
  'google/gemini-2.0-flash-001': { input: 0, output: 0, free: false },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
};

export type ModelTask =
  | 'chat'
  | 'review'
  | 'html_report'
  | 'intelligence_report'
  | 'conversation_summary';

export interface ModelConfig {
  modelId: string;
  provider: ReturnType<typeof createOpenAI>;
  providerLabel: string;
  pricing: { input: number; output: number; free?: boolean };
  routingReason: string;
}

function hasDashScope() {
  return Boolean(process.env.DASHSCOPE_API_KEY && process.env.DASHSCOPE_API_KEY !== 'your_dashscope_api_key_here');
}

function hasOpenRouter() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

function createDashScopeProvider() {
  return createOpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY || '',
    baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
  });
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
  return Boolean(
    hasDashScope() ||
    hasOpenRouter() ||
    process.env.OPENAI_API_KEY
  );
}

export function getModelConfig(task: ModelTask = 'chat'): ModelConfig {
  const budgetMode = process.env.AI_BUDGET_MODE || 'balanced';

  if (task === 'intelligence_report') {
    if (hasDashScope()) {
      const modelId = budgetMode === 'conservative'
        ? (process.env.DASHSCOPE_CHAT_MODEL || 'qwen-plus')
        : (process.env.DASHSCOPE_INTELLIGENCE_MODEL || 'qwen-max');
      return {
        modelId,
        provider: createDashScopeProvider(),
        providerLabel: 'Alibaba DashScope',
        pricing: PRICING[modelId] || PRICING['qwen-max'],
        routingReason: budgetMode === 'conservative'
          ? 'Budget mode conservador: relatório de inteligência rebaixado para modelo balanceado.'
          : 'Relatório de inteligência usa modelo premium para síntese agregada e geração de issues.',
      };
    }

    if (hasOpenRouter()) {
      const modelId = 'google/gemini-2.0-flash-001';
      return {
        modelId,
        provider: createOpenRouterProvider(),
        providerLabel: 'OpenRouter (paid)',
        pricing: PRICING[modelId] || { input: 0, output: 0 },
        routingReason: 'Fallback de relatório de inteligência via OpenRouter por indisponibilidade da DashScope.',
      };
    }
  }

  if (task === 'review' || task === 'html_report' || task === 'conversation_summary') {
    if (hasOpenRouter()) {
      const modelId = 'google/gemini-2.0-flash-001';
      return {
        modelId,
        provider: createOpenRouterProvider(),
        providerLabel: 'OpenRouter (paid)',
        pricing: PRICING[modelId] || { input: 0, output: 0 },
        routingReason: 'Tarefa estruturada/auxiliar roteada para modelo rápido e econômico.',
      };
    }

    if (hasDashScope()) {
      const modelId = process.env.DASHSCOPE_AUX_MODEL || 'qwen-plus';
      return {
        modelId,
        provider: createDashScopeProvider(),
        providerLabel: 'Alibaba DashScope',
        pricing: PRICING[modelId] || PRICING['qwen-plus'],
        routingReason: 'Tarefa estruturada/auxiliar usando modelo balanceado da DashScope.',
      };
    }
  }

  if (hasDashScope()) {
    const modelId = process.env.DASHSCOPE_CHAT_MODEL || 'qwen-plus';
    return {
      modelId,
      provider: createDashScopeProvider(),
      providerLabel: 'Alibaba DashScope',
      pricing: PRICING[modelId] || PRICING['qwen-plus'],
      routingReason: 'Chat principal prioriza consistência no provedor primário.',
    };
  }

  if (hasOpenRouter()) {
    const modelId = 'google/gemini-2.0-flash-001';
    return {
      modelId,
      provider: createOpenRouterProvider(),
      providerLabel: 'OpenRouter (paid)',
      pricing: PRICING[modelId] || { input: 0, output: 0 },
      routingReason: 'Fallback geral via OpenRouter.',
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

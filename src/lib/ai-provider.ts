import { createOpenAI } from '@ai-sdk/openai';

export const PRICING: Record<string, { input: number; output: number; free?: boolean }> = {
  'qwen-plus': { input: 0.0008, output: 0.002 },
  'qwen-max': { input: 0.0016, output: 0.007 },
  'google/gemini-2.0-flash-001': { input: 0, output: 0, free: false },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
};

export function hasAvailableProvider() {
  return Boolean(
    (process.env.DASHSCOPE_API_KEY && process.env.DASHSCOPE_API_KEY !== 'your_dashscope_api_key_here') ||
    process.env.OPENROUTER_API_KEY ||
    process.env.OPENAI_API_KEY
  );
}

export function getProvider() {
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

export function getModelId() {
  if (process.env.DASHSCOPE_API_KEY && process.env.DASHSCOPE_API_KEY !== 'your_dashscope_api_key_here') return 'qwen-plus';
  if (process.env.OPENROUTER_API_KEY) return 'google/gemini-2.0-flash-001';
  return 'gpt-4o-mini';
}

export function getProviderLabel() {
  if (process.env.DASHSCOPE_API_KEY && process.env.DASHSCOPE_API_KEY !== 'your_dashscope_api_key_here') return 'Alibaba DashScope';
  if (process.env.OPENROUTER_API_KEY) return 'OpenRouter (paid)';
  return 'OpenAI';
}

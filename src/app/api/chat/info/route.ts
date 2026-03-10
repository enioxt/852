import { NextResponse } from 'next/server';

function getModelId() {
  if (process.env.DASHSCOPE_API_KEY && process.env.DASHSCOPE_API_KEY !== 'your_dashscope_api_key_here') return 'qwen-plus';
  if (process.env.OPENROUTER_API_KEY) return 'google/gemini-2.0-flash-001';
  return 'gpt-4o-mini';
}

function getProviderLabel() {
  if (process.env.DASHSCOPE_API_KEY && process.env.DASHSCOPE_API_KEY !== 'your_dashscope_api_key_here') return 'Alibaba DashScope';
  if (process.env.OPENROUTER_API_KEY) return 'OpenRouter (paid)';
  return 'OpenAI';
}

const PRICING: Record<string, { input: number; output: number; free?: boolean }> = {
  'qwen-plus': { input: 0.0008, output: 0.002 },
  'google/gemini-2.0-flash-001': { input: 0, output: 0, free: false },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
};

export async function GET() {
  const modelId = getModelId();
  const provider = getProviderLabel();
  const pricing = PRICING[modelId] || { input: 0, output: 0 };

  return NextResponse.json({
    modelId,
    provider,
    free: pricing.free || false,
    pricing: { input: pricing.input, output: pricing.output },
  });
}

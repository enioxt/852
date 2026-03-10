import { NextResponse } from 'next/server';
import { getModelId, getProviderLabel, PRICING } from '@/lib/ai-provider';

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

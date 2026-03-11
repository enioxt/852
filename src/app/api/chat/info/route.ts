import { NextResponse } from 'next/server';
import { getModelConfig } from '@/lib/ai-provider';

export async function GET() {
  const { modelId, providerLabel, pricing, routingReason } = getModelConfig('chat');

  return NextResponse.json({
    modelId,
    provider: providerLabel,
    free: pricing.free || false,
    pricing: { input: pricing.input, output: pricing.output },
    routingReason,
  });
}

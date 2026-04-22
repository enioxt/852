/**
 * 852 Internal Discovery Endpoint (CHAT-GW-004)
 *
 * Called by egos-gateway to build its routing table.
 * No chatbot-core dependency — plain Next.js route handler.
 */

import { NextResponse } from 'next/server';

const MANIFEST = {
  name: '852 Assistente PCMG',
  slug: '852',
  version: '2.0.0',
  description: 'Assistente jurídico e institucional da Polícia Civil de Minas Gerais',
  intents: ['jurídico', 'institucional', 'policia-civil', 'pcmg', 'ocorrência'],
  capabilities: ['streaming', 'tools', 'document-search', 'institutional-search'],
  use_case: 'public-legal-assistant',
  status: 'active',
} as const;

export function GET(): NextResponse {
  return NextResponse.json({
    ...MANIFEST,
    startedAt: new Date().toISOString(),
  });
}

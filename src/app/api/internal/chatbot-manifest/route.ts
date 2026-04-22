/**
 * GET /api/internal/chatbot-manifest
 *
 * Machine-readable manifest consumed by EGOS chatbot-manifest-aggregator
 * to auto-populate CHATBOT_SSOT.md AUTO-GEN blocks without handwritten scores.
 *
 * INC-006 MSSOT-003: evidence-anchored capability declarations.
 * Each capability references the file:line where it's implemented so the
 * aggregator can verify claims against source before writing them.
 */
import { NextResponse } from 'next/server';

const MANIFEST = {
  chatbot_id: '852',
  repo: 'github.com/enioxt/852',
  generated_at: new Date().toISOString(),
  schema_version: '1.0.0',

  capabilities: {
    multi_tenant: {
      present: true,
      evidence: 'src/app/api/chat/route.ts:15',
      note: 'getIdentityKey() scopes session per user',
    },
    atrian_validation: {
      present: true,
      evidence: 'src/app/api/chat/route.ts:6',
      note: 'filterChunk + validateAndLog from @/lib/atrian; ATRiAN v2 rolling buffer at :12',
    },
    sse_streaming: {
      present: true,
      evidence: 'src/app/api/chat/route.ts:313',
      note: 'textStream.pipeThrough(atrianTransform).pipeThrough(TextEncoderStream)',
    },
    pii_detection: {
      present: true,
      evidence: 'src/app/api/chat/route.ts:74',
      note: 'require(@/lib/pii-scanner) scanForPII + sanitizeText inline',
    },
    tool_calling: {
      present: true,
      evidence: 'src/app/api/chat/route.ts:24',
      note: 'INSTITUTIONAL_SEARCH_TOOL + LEGAL_SEARCH_TOOL defined in @/lib/ai-tools',
    },
    rate_limiting: {
      present: true,
      evidence: 'src/app/api/chat/route.ts:4',
      note: 'checkRateLimit + checkIdentityBudget from @/lib/rate-limit',
    },
    telemetry: {
      present: true,
      evidence: 'src/app/api/chat/route.ts:5',
      note: 'recordChatCompletion, recordRateLimitHit, recordChatError, recordEvent',
    },
    guard_brasil_pii: {
      present: false,
      evidence: null,
      note: 'Uses local pii-scanner, not @egosbr/guard-brasil endpoint',
    },
  },

  compliance: {
    primary_use_case: 'Public chatbot for Brazilian legal/institutional queries',
    atrian_score_method: 'N/A — aggregator computes from capability flags above',
    last_verified: '2026-04-17',
    verified_by: 'MSSOT-003 auto-manifest endpoint',
  },
} as const;

export async function GET() {
  return NextResponse.json(MANIFEST, {
    headers: {
      'Cache-Control': 'public, max-age=300',
      'X-EGOS-Schema': '1.0.0',
    },
  });
}
